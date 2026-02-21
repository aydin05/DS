import logging
import threading
import time
from datetime import timedelta

from django.utils import timezone
from django.template import Template, Context

logger = logging.getLogger(__name__)

_checker_started = False
_checker_lock = threading.Lock()

DEFAULT_CHECK_INTERVAL_SECONDS = 300  # 5 minutes


def start_device_status_checker():
    """Start the background thread that periodically checks device status.
    Safe to call multiple times — only one thread will be started."""
    global _checker_started
    with _checker_lock:
        if _checker_started:
            return
        _checker_started = True

    thread = threading.Thread(target=_run_checker_loop, daemon=True)
    thread.start()
    logger.info("Device status checker background thread started.")


def _run_checker_loop():
    """Main loop: sleep, then check inactive devices and send emails."""
    # Wait 30 seconds after startup to let Django fully initialize
    time.sleep(30)

    while True:
        try:
            interval = _check_and_notify()
        except Exception:
            logger.exception("Error in device status checker loop")
            interval = DEFAULT_CHECK_INTERVAL_SECONDS

        time.sleep(interval)


def _check_and_notify():
    """Check all companies for inactive/active device transitions and send notifications.
    Returns the sleep interval in seconds for the next check."""
    from notification.models import EmailConfig, NotificationSetting
    from display.models import Display
    from core.api.serializer import get_threshold_for_company

    settings_qs = NotificationSetting.objects.filter(
        is_enabled=True,
        recipient_list__isnull=False,
    ).select_related('company', 'recipient_list', 'inactive_template', 'active_template')

    logger.info(f"[CHECKER] Running check. Found {settings_qs.count()} active notification settings")

    min_interval = DEFAULT_CHECK_INTERVAL_SECONDS

    for ns in settings_qs:
        company = ns.company
        check_interval_sec = ns.check_interval_seconds
        if check_interval_sec < min_interval:
            min_interval = check_interval_sec

        # Per-company heartbeat threshold
        threshold_sec = get_threshold_for_company(company)
        threshold = timezone.now() - timedelta(seconds=threshold_sec)

        try:
            email_config = EmailConfig.objects.get(company=company, is_active=True)
        except EmailConfig.DoesNotExist:
            logger.warning(f"[CHECKER] {company.name}: No active EmailConfig, skipping.")
            continue

        recipients = list(
            ns.recipient_list.recipients.values_list('email', flat=True)
        )
        if not recipients:
            logger.warning(f"[CHECKER] {company.name}: Recipient list is empty, skipping.")
            continue

        # Base queryset: only displays with notifications enabled
        from django.db.models import Q
        notifiable = Display.objects.filter(
            company=company,
            notifications_enabled=True,
            branch__notifications_enabled=True,
        ).select_related('branch')

        # If the recipient list is scoped to specific branches, filter further
        rl_branches = ns.recipient_list.branches.all()
        if rl_branches.exists():
            notifiable = notifiable.filter(branch__in=rl_branches)

        # --- 1) Devices that went INACTIVE (heartbeat stale + not yet notified) ---
        newly_inactive = notifiable.filter(
            Q(last_heartbeat__lt=threshold) | Q(last_heartbeat__isnull=True),
            was_notified_inactive=False,
        )

        # --- 2) Devices that came back ACTIVE (heartbeat fresh + were notified inactive) ---
        back_online = notifiable.filter(
            last_heartbeat__gte=threshold,
            was_notified_inactive=True,
        )

        inactive_count = newly_inactive.count()
        online_count = back_online.count()
        logger.info(f"[CHECKER] {company.name}: threshold={threshold_sec}s, "
                    f"{inactive_count} newly inactive, {online_count} back online")
        if inactive_count == 0 and online_count == 0:
            continue

        from notification.email_sender import send_email

        # Send INACTIVE notifications
        inactive_tpl = ns.inactive_template
        for display in newly_inactive:
            if not inactive_tpl:
                continue
            subject = _render(inactive_tpl.subject, display, company, status='Inactive')
            body = _render(inactive_tpl.body, display, company, status='Inactive')
            success, error = send_email(email_config, recipients, subject, body)
            if success:
                display.was_notified_inactive = True
                display.last_notified_inactive_at = timezone.now()
                display.save(update_fields=['was_notified_inactive', 'last_notified_inactive_at'])
                logger.info(f"[INACTIVE] Sent notification for '{display.name}' ({company.name})")
            else:
                logger.error(f"[INACTIVE] Failed for '{display.name}' ({company.name}): {error}")

        # Send ACTIVE (back online) notifications
        active_tpl = ns.active_template
        for display in back_online:
            if not active_tpl:
                continue
            subject = _render(active_tpl.subject, display, company, status='Active')
            body = _render(active_tpl.body, display, company, status='Active')
            success, error = send_email(email_config, recipients, subject, body)
            if success:
                display.was_notified_inactive = False
                display.save(update_fields=['was_notified_inactive'])
                logger.info(f"[ACTIVE] Sent notification for '{display.name}' ({company.name})")
            else:
                logger.error(f"[ACTIVE] Failed for '{display.name}' ({company.name}): {error}")

    return min_interval


def _render(template_str, display, company, status='Inactive'):
    """Render a template string with device context variables."""
    tpl_str = template_str.replace('{{device_name}}', '{{ device_name }}')
    tpl_str = tpl_str.replace('{{branch_name}}', '{{ branch_name }}')
    tpl_str = tpl_str.replace('{{status}}', '{{ status }}')
    tpl_str = tpl_str.replace('{{last_heartbeat}}', '{{ last_heartbeat }}')
    tpl_str = tpl_str.replace('{{company_name}}', '{{ company_name }}')

    template = Template(tpl_str)
    context = Context({
        'device_name': display.name,
        'branch_name': display.branch.name if display.branch else '-',
        'status': status,
        'last_heartbeat': str(display.last_heartbeat) if display.last_heartbeat else 'Never',
        'company_name': company.name,
    })
    return template.render(context)
