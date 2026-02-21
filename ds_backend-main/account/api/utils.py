def default_create_token(model, user):
    _, token = model.objects.create(user)
    return token