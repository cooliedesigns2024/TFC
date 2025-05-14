const fares = {
    "Mabopane-Shakung": 28,
    "Klipgat-Shakung": 20,
    "Madidi-Winterveld": 35,
    "Dipompong-Mabopane": 25
};

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let totalCashMade = JSON.parse(localStorage.getItem("totalCash")) || 0;

// Generate preset buttons
function generateButtons(containerId, options) {
    const container = document.getElementById(containerId);
    options.forEach(option => {
        const button = document.createElement("button");
        button.classList.add("btn", "btn-secondary", "m-2");
        button.textContent = option;

        button.onclick = function () {
            document.querySelectorAll(`#${containerId} button`).forEach(btn => {
                btn.classList.remove("btn-selected");
                btn.classList.add("btn-secondary");
            });

            this.classList.remove("btn-secondary");
            this.classList.add("btn-selected");

            localStorage.setItem(containerId, option);
        };

        container.appendChild(button);
    });
}

function calculateFare() {
    const pickup = localStorage.getItem("pickup");
    const destination = localStorage.getItem("destination");
    const passengers = localStorage.getItem("passengers") || 1;
    const cashReceived = document.getElementById("cashReceived").value;
    const key = `${pickup}-${destination}`;

    if (fares[key]) {
        const totalFare = fares[key] * passengers;
        const change = cashReceived - totalFare;

        document.getElementById("fareDisplay").textContent = `Fare: R${totalFare}`;
        document.getElementById("changeDisplay").textContent = `Change: R${change}`;
        document.getElementById("recordTransaction").disabled = false;
    } else {
        document.getElementById("fareDisplay").textContent = "Invalid Route!";
    }
}

function recordTransaction() {
    const pickup = localStorage.getItem("pickup");
    const destination = localStorage.getItem("destination");
    const passengers = localStorage.getItem("passengers") || 1;
    const cashReceived = document.getElementById("cashReceived").value;
    const key = `${pickup}-${destination}`;
    const totalFare = fares[key] * passengers;
    const change = cashReceived - totalFare;

    const transaction = {
        transactionNumber: transactions.length + 1,
        date: new Date().toLocaleString(),
        pickup,
        destination,
        passengers,
        cashReceived,
        totalFare,
        change,
        status: "pending"
    };

    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    totalCashMade += totalFare;
    localStorage.setItem("totalCash", JSON.stringify(totalCashMade));
    document.getElementById("totalCash").textContent = `R${totalCashMade}`;

    updateTransactionLog();
}

function markTransactionComplete(transactionIndex) {
    transactions[transactionIndex].status = "completed";
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateTransactionLog();
}

function updateTransactionLog() {
    const transactionTableBody = document.getElementById("transactionTableBody");
    transactionTableBody.innerHTML = "";

    transactions.forEach((t, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${t.transactionNumber}</td>
            <td>${t.date}</td>
            <td>${t.pickup}</td>
            <td>${t.destination}</td>
            <td>${t.passengers}</td>
            <td>R${t.totalFare}</td>
            <td>R${t.cashReceived}</td>
            <td>R${t.change}</td>
            <td class="${t.status === 'completed' ? 'transaction-completed' : 'transaction-pending'}">${t.status}</td>
            <td><button class="btn btn-success btn-sm" onclick="markTransactionComplete(${index})">Complete</button></td>
        `;

        transactionTableBody.appendChild(row);
    });
}

generateButtons("passengers", Array.from({ length: 10 }, (_, i) => (i + 1).toString()));
generateButtons("pickup", Object.keys(fares).map(route => route.split("-")[0]));
generateButtons("destination", Object.keys(fares).map(route => route.split("-")[1]));