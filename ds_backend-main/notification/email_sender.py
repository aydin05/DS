"""
SMTP email sender helper.
"""
import logging
from django.core.mail import get_connection, EmailMessage

logger = logging.getLogger(__name__)


def send_email(config, to_emails, subject, body):
    """Send an email via SMTP using the company's EmailConfig.

    Args:
        config: EmailConfig model instance
        to_emails: list of recipient email addresses
        subject: email subject string
        body: email body string

    Returns:
        (success: bool, error: str or None)
    """
    connection = None
    try:
        connection = get_connection(
            host=config.host,
            port=config.port,
            username=config.username,
            password=config.password,
            use_tls=config.use_tls,
            timeout=15,
        )
        from_email = config.username
        if getattr(config, 'from_name', '') and config.from_name.strip():
            from_email = f"{config.from_name} <{config.username}>"
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email,
            to=to_emails,
            connection=connection,
        )
        email.send()
        logger.info(f"Email sent to {to_emails}")
        return True, None
    except Exception as e:
        logger.exception("Email send failed")
        return False, str(e)
    finally:
        if connection:
            try:
                connection.close()
            except Exception:
                pass
