import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    name: "",
    surname: "",
    phoneNumber: "",
    identityNumber: "",
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [transaction, setTransaction] = useState({ type: "", amount: "" });
  const [transferData, setTransferData] = useState({
    recipientName: "",
    transferAmount: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});

  const validatePhoneNumber = (phoneNumber) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(phoneNumber);
  };

  const validateIdNumber = (idNumber) => {
    const regex = /^[0-9]{13}$/;
    return regex.test(idNumber);
  };

  // Login handler
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/login",
        loginData
      );

      if (response && response.data && response.data.message) {
        alert(response.data.message);
        if (response.data.account_number) {
          fetchDashboard(response.data.account_number);
        } else {
          alert("Account number missing in response");
        }
      } else {
        alert("Invalid response from the server");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  // Registration handler
  const handleRegistration = async () => {
    setLoading(true);
    let errors = {};

    if (!validatePhoneNumber(registerData.phoneNumber)) {
      errors.phoneNumber = "Phone number must be exactly 10 digits";
    }
    if (!validateIdNumber(registerData.identityNumber)) {
      errors.identityNumber = "ID number must be exactly 13 digits";
    }

    if (Object.keys(errors).length > 0) {
      setErrorMessages(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/register",
        registerData
      );

      alert(response.data.message);
      setIsRegistering(false);
      setRegisterData({
        username: "",
        password: "",
        name: "",
        surname: "",
        phoneNumber: "",
        identityNumber: "",
      });
      setErrorMessages({});
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error || "An error occurred during registration"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data for logged-in user
  const fetchDashboard = async (accountNumber) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/dashboard/${accountNumber}`
      );
      if (response && response.data) {
        setDashboardData({ accountNumber, ...response.data });
      } else {
        alert("Failed to load dashboard data");
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "An error occurred while fetching dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction (Deposit/Withdraw/Transfer)
  const handleTransaction = async () => {
    setLoading(true);

    // Validate transaction amount
    const amount = parseFloat(transaction.amount);
    
    if (isNaN(amount) || amount <= 0) {
      alert("Amount must be a positive number.");
      setLoading(false);
      return;
    }

    // Additional validation for withdrawal
    if (transaction.type === "withdraw" && amount > dashboardData.balance) {
      alert("Insufficient balance for this withdrawal.");
      setLoading(false);
      return;
    }

    try {
      if (transaction.type === "transfer") {
        const response = await axios.post("http://127.0.0.1:5000/transfer", {
          source_account_number: dashboardData.accountNumber,
          recipient_name: transferData.recipientName,
          amount: amount,
        });
        alert(response.data.message);
      } else {
        const response = await axios.post(
          `http://127.0.0.1:5000/${transaction.type}`,
          {
            account_number: dashboardData.accountNumber,
            amount: amount,
          }
        );
        alert(response.data.message);
      }

      fetchDashboard(dashboardData.accountNumber); // Refresh dashboard after transaction
      setTransaction({ type: "", amount: "" });
      setTransferData({ recipientName: "", transferAmount: "" });
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "An error occurred during the transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle transaction history visibility
  const toggleTransactionHistory = () => {
    setShowTransactionHistory(!showTransactionHistory);
  };

  // Logout handler
  const handleLogout = () => {
    setDashboardData(null);
    setLoginData({ username: "", password: "" });
    setIsRegistering(false);
  };

  return (
    <div className="app">
      <h1>Welcome to Bankify💵</h1>

      {loading && <p>Loading...</p>}

      {isRegistering ? (
        <div className="register">
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Username"
            value={registerData.username}
            onChange={(e) =>
              setRegisterData({ ...registerData, username: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={registerData.password}
            onChange={(e) =>
              setRegisterData({ ...registerData, password: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Name"
            value={registerData.name}
            onChange={(e) =>
              setRegisterData({ ...registerData, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Surname"
            value={registerData.surname}
            onChange={(e) =>
              setRegisterData({ ...registerData, surname: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={registerData.phoneNumber}
            onChange={(e) =>
              setRegisterData({ ...registerData, phoneNumber: e.target.value })
            }
          />
          {errorMessages.phoneNumber && (
            <p style={{ color: "red" }}>{errorMessages.phoneNumber}</p>
          )}

          <input
            type="text"
            placeholder="Identity Number"
            value={registerData.identityNumber}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                identityNumber: e.target.value,
              })
            }
          />
          {errorMessages.identityNumber && (
            <p style={{ color: "red" }}>{errorMessages.identityNumber}</p>
          )}

          <button onClick={handleRegistration}>Register</button>
          <p onClick={() => setIsRegistering(false)} className="toggle-link">
            Already have an account? Login here
          </p>
        </div>
      ) : !dashboardData ? (
        <div className="login">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={loginData.username}
            onChange={(e) =>
              setLoginData({ ...loginData, username: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
          />
          <button onClick={handleLogin}>Login</button>
          <p onClick={() => setIsRegistering(true)} className="toggle-link">
            Don't have an account? Register here
          </p>
        </div>
      ) : (
        <div className="dashboard">
          <h2>Dashboard</h2>
          <p>Account Balance: R {dashboardData.balance}</p>
          <h3>Make a Transaction</h3>

          <div className="transaction-buttons">
            <button
              onClick={() => setTransaction({ ...transaction, type: "deposit" })}
              className={transaction.type === "deposit" ? "active" : ""}
            >
              Deposit
            </button>
            <button
              onClick={() => setTransaction({ ...transaction, type: "withdraw" })}
              className={transaction.type === "withdraw" ? "active" : ""}
            >
              Withdraw
            </button>
            <button
              onClick={() => setTransaction({ ...transaction, type: "transfer" })}
              className={transaction.type === "transfer" ? "active" : ""}
            >
              Transfer
            </button>
          </div>

          {transaction.type && (
            <div>
              <input
                type="number"
                value={transaction.amount}
                onChange={(e) =>
                  setTransaction({ ...transaction, amount: e.target.value })
                }
                placeholder="Amount"
              />
              {transaction.type === "transfer" && (
                <input
                  type="text"
                  value={transferData.recipientName}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      recipientName: e.target.value,
                    })
                  }
                  placeholder="Recipient Name"
                />
              )}
              <button onClick={handleTransaction}>Submit Transaction</button>
            </div>
          )}

          <button onClick={toggleTransactionHistory}>
            {showTransactionHistory
              ? "Hide Transaction History"
              : "Show Transaction History"}
          </button>

          {showTransactionHistory && (
            <div>
              {/* Render transaction history here */}
              <p>Transaction history goes here.</p>
            </div>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default App;
