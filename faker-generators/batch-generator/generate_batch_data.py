from jsf import JSF

faker = JSF(
    {
        "type": "object",
        "properties": {
            "name": {"type": "string", "$provider": "faker.name"},
            "email": {"type": "string", "$provider": "faker.email"},
        },
        "required": ["name", "email"],
    }
)

fake_json = faker.generate()

print(fake_json)