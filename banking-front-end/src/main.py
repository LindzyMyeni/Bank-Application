from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import datetime

app = Flask(__name__)
CORS(app)


# Helper function to read user data
def read_user_data(username):
    try:
        with open(f"{username}.txt", "r") as file:
            user_data = file.readlines()
        return {
            "name": user_data[0].split(":")[1].strip(),
            "surname": user_data[1].split(":")[1].strip(),
            "phone_number": user_data[2].split(":")[1].strip(),
            "id_number": user_data[3].split(":")[1].strip(),
            "account_number": user_data[4].split(":")[1].strip(),
            "password": user_data[5].split(":")[1].strip(),
            "balance": float(user_data[6].split(":")[1].strip()),
        }
    except FileNotFoundError:
        return None


# Helper function to write user data to a file
def write_user_data(username, data):
    with open(f"{username}.txt", "w") as file:
        file.write(f"Name: {data['name']}\n")
        file.write(f"Surname: {data['surname']}\n")
        file.write(f"Phone Number: {data['phone_number']}\n")
        file.write(f"ID Number: {data['id_number']}\n")
        file.write(f"Account Number: {data['account_number']}\n")
        file.write(f"Password: {data['password']}\n")
        file.write(f"Balance: {data['balance']}\n")


# Helper function to log transactions
def log_transaction(account_number, transaction_type, amount):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    transaction = f"{timestamp} | {transaction_type} | {amount}\n"

    # Append the transaction to the account's transaction log file
    transaction_filename = f"{account_number}_transactions.txt"
    with open(transaction_filename, "a") as file:
        file.write(transaction)


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')

    # Check if the username already exists
    if os.path.exists(f"{username}.txt"):
        return jsonify({"error": "Account already exists"}), 400

    # Create a new account
    account_number = str(random.randint(100000, 999999))
    user_data = {
        "name": data.get("name"),
        "surname": data.get("surname"),
        "phone_number": data.get("phoneNumber"),
        "id_number": data.get("identityNumber"),
        "account_number": account_number,
        "password": data.get("password"),
        "balance": 0,
    }

    # Save the user data
    write_user_data(username, user_data)
    return jsonify({"message": "Account created successfully", "account_number": account_number}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user_data = read_user_data(username)
    if not user_data or user_data['password'] != password:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"message": "Login successful", "account_number": user_data['account_number']}), 200


@app.route('/dashboard/<account_number>', methods=['GET'])
def dashboard(account_number):
    for file in os.listdir():
        if not file.endswith(".txt"):
            continue
        user_data = read_user_data(file[:-4])
        if user_data and user_data['account_number'] == account_number:
            return jsonify({
                "balance": user_data['balance'],
                "transactions": [],
            })
    return jsonify({"error": "Account not found"}), 404


@app.route('/deposit', methods=['POST'])
def deposit():
    data = request.json
    account_number = data.get('account_number')
    amount = data.get('amount')

    for file in os.listdir():
        if not file.endswith(".txt"):
            continue
        user_data = read_user_data(file[:-4])
        if user_data and user_data['account_number'] == account_number:
            user_data['balance'] += amount
            write_user_data(file[:-4], user_data)

            # Log the transaction
            log_transaction(account_number, 'Deposit', amount)

            return jsonify({"message": f"Deposited {amount} successfully"}), 200

    return jsonify({"error": "Account not found"}), 404


@app.route('/withdraw', methods=['POST'])
def withdraw():
    data = request.json
    account_number = data.get('account_number')
    amount = data.get('amount')

    for file in os.listdir():
        if not file.endswith(".txt"):
            continue
        user_data = read_user_data(file[:-4])
        if user_data and user_data['account_number'] == account_number:
            if user_data['balance'] < amount:
                return jsonify({"error": "Insufficient funds"}), 400

            user_data['balance'] -= amount
            write_user_data(file[:-4], user_data)

            # Log the transaction
            log_transaction(account_number, 'Withdrawal', amount)

            return jsonify({"message": f"Withdrew {amount} successfully"}), 200

    return jsonify({"error": "Account not found"}), 404


@app.route('/transfer', methods=['POST'])
def transfer():
    data = request.json
    source_account_number = data.get('source_account_number')
    recipient_name = data.get('recipient_name')  # Updated key from React App
    amount = data.get('amount')

    source_user_data = None
    destination_user_data = None
    destination_username = None  # Track the file name for destination account

    for file in os.listdir():
        if not file.endswith(".txt"):
            continue
        user_data = read_user_data(file[:-4])

        if user_data['account_number'] == source_account_number:
            source_user_data = user_data
        elif user_data['name'] == recipient_name:
            destination_user_data = user_data
            destination_username = file[:-4]

    if not source_user_data:
        return jsonify({"error": "Source account not found"}), 404
    if not destination_user_data:
        return jsonify({"error": "Recipient account not found"}), 404

    if source_user_data['balance'] < amount:
        return jsonify({"error": "Insufficient funds"}), 400

    source_user_data['balance'] -= amount
    destination_user_data['balance'] += amount

    write_user_data(source_user_data['account_number'], source_user_data)
    write_user_data(destination_username, destination_user_data)

    # Log transactions
    log_transaction(source_account_number, 'Transfer Out', amount)
    log_transaction(destination_user_data['account_number'], 'Transfer In', amount)

    return jsonify({"message": f"Transferred {amount} to {recipient_name} successfully"}), 200


@app.route('/transactions/<account_number>', methods=['GET'])
def transactions(account_number):
    try:
        transaction_filename = f"{account_number}_transactions.txt"
        if os.path.exists(transaction_filename):
            with open(transaction_filename, "r") as file:
                transactions = file.readlines()

            return jsonify({"transactions": [txn.strip() for txn in transactions]}), 200
        else:
            return jsonify({"transactions": []}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)

