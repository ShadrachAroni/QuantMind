import bcrypt

password = b"Mokua@Aroni52"
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())
