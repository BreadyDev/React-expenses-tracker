import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    customCategory: ""
  });
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
    }
  }, [isAuthenticated]);

  const fetchExpenses = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8081/expenses", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    const totals = calculateCategoryTotals(expenses);
    setTotalExpense(calculateTotalExpense(expenses));
    setCategoryTotals(totals);
    setCategories(extractCategories(expenses));
  }, [expenses]);

  const calculateTotalExpense = (data) => {
    return data.reduce((acc, expense) => acc + parseFloat(expense.amount), 0);
  };

  const calculateCategoryTotals = (data) => {
    return data.reduce((totals, expense) => {
      const category = expense.category;
      const amount = parseFloat(expense.amount);
      totals[category] = (totals[category] || 0) + amount;
      return totals;
    }, {});
  };

  const extractCategories = (data) => {
    return Array.from(new Set(data.map(expense => expense.category)));
  };

  const handleAddExpense = () => {
    const token = localStorage.getItem("token");
    const category = newExpense.category === "Otra" ? newExpense.customCategory : newExpense.category;
    const expenseToSave = { ...newExpense, category };

    fetch("http://localhost:8081/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(expenseToSave),
    })
      .then(() => {
        console.log("Gasto agregado exitosamente");
        fetchExpenses();
        setNewExpense({ description: "", amount: "", category: "", customCategory: "" }); // Limpiar formulario

        if (category === newExpense.customCategory && !categories.includes(category)) {
          setCategories(prevCategories => [...prevCategories, category]);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDeleteExpense = (id) => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:8081/expenses/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then(() => {
        console.log("Gasto eliminado exitosamente");
        fetchExpenses();
      })
      .catch((err) => console.log(err));
  };

  const handleLogin = () => {
    fetch("http://localhost:8081/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          setIsAuthenticated(true);
        } else {
          alert("Error en el inicio de sesión");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleRegister = () => {
    fetch("http://localhost:8081/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === 'Usuario registrado exitosamente') {
          alert("Registro exitoso, por favor inicie sesión");
          setIsRegistering(false);
        } else {
          alert("Error en el registro");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const colors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 102, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(255, 191, 128, 0.6)',
    'rgba(119, 221, 119, 0.6)',
    'rgba(176, 196, 222, 0.6)',
    'rgba(255, 182, 193, 0.6)',
    'rgba(173, 216, 230, 0.6)',
    'rgba(255, 228, 196, 0.6)' 
  ];

  const borderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 132, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(255, 191, 128, 1)',
    'rgba(119, 221, 119, 1)',
    'rgba(176, 196, 222, 1)',
    'rgba(255, 182, 193, 1)',
    'rgba(173, 216, 230, 1)',
    'rgba(255, 228, 196, 1)' 
  ];

  const doughnutData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Total por Categoría',
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Gastos por Categoría',
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Rastreador de Gastos</h1>
        <h2>{isRegistering ? "Registrar" : "Iniciar Sesión"}</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><a> </a>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /> <br /><br />
        <button onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? "Registrar" : "Iniciar Sesión"}
        </button><br /><br />
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Ya tengo una cuenta" : "No tengo una cuenta"}
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="heade-title">
      <h1>Rastreador de Gastos</h1>
        <div className="button-container">
          <h3>USUARIO: {username}</h3>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </div>

      <h4>Registro de gastos personales por categoría</h4>
      <div className="form-container">
        <h3>Agregar Gasto</h3>
        <input
          type="text"
          placeholder="Descripción"
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Monto"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
        />
        <select
          value={newExpense.category}
          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
        >
          <option value="">Seleccionar Categoría</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
          <option value="Otra">Otra</option>
        </select>
        {newExpense.category === "Otra" && (
          <input
            type="text"
            placeholder="Nueva Categoría"
            value={newExpense.customCategory}
            onChange={(e) => setNewExpense({ ...newExpense, customCategory: e.target.value })}
          />
        )}
        <button onClick={handleAddExpense}>Agregar Gasto</button>
      </div>

      <div className="expenses-container">
        <div className="expenses-table">
          <table>
            <caption>Gastos</caption>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>${expense.amount}</td>
                  <td>{expense.category}</td>
                  <td>
                    <button onClick={() => handleDeleteExpense(expense.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-container">
          <div className="category-totals">
            <h3>Totales por Categoría:</h3>
            {Object.entries(categoryTotals).map(([category, total]) => (
              <p key={category}>
                {category}: ${total.toFixed(2)}
              </p>
            ))}
          </div>
          <div className="total-expense">
            <h4>Total Gastos: ${totalExpense.toFixed(2)}</h4>
          </div>
        </div>

          <div className="chart-container">
            <div className="chart-wrapper">
              <h3>Distribución de Gastos por Categoría:</h3>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
      </div>
    </div>
  );
}

export default App;