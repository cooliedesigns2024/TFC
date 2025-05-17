$(document).ready(() => {
    const passengersInput = $('#passengers');
    const pickupInput = $('#pickup');
    const destinationInput = $('#destination');
    const cashReceivedInput = $('#cash-received');
    const calculateButton = $('#calculate-button');
    const changeDisplay = $('#change-display');
    const transactionList = $('#transaction-list');
    const downloadButton = $('#download-button');
    const passengerButtonsDiv = $('#passenger-buttons');
    const pickupButtonsDiv = $('#pickup-buttons');
    const destinationButtonsDiv = $('#destination-buttons');
    const dailyEarningsDisplay = $('#daily-earnings');
    const resetEarningsButton = $('#reset-earnings');

    const pickupLocations = ["Shakung", "Moiletswane", "Madidi"];
    const destinationLocations = ["Shakung", "Moiletswane", "Madidi"];
    const fares = {
        "Shakung-Moiletswane": 15, "Moiletswane-Shakung": 15,
        "Shakung-Madidi": 35, "Madidi-Shakung": 28,
        "Moiletswane-Madidi": 40, "Madidi-Moiletswane": 40,
        // Add more fares as needed
    };
    const passengerPresets = Array.from({ length: 10 }, (_, i) => i + 1);
    const STORAGE_KEY = 'taxiTransactions';
    const EARNINGS_KEY = 'dailyEarnings_' + new Date().toLocaleDateString(); // Unique key per day

    let transactions = loadTransactions();
    let dailyEarnings = loadDailyEarnings();
    displayTransactions();
    displayDailyEarnings();

    // --- Create Preset Buttons for Passengers ---
    passengerPresets.forEach(num => {
        const button = $('<button type="button" class="btn btn-outline-primary">' + num + '</button>');
        button.on('click', () => passengersInput.val(num));
        passengerButtonsDiv.append(button);
    });

    // --- Create Preset Buttons for Pickup Locations ---
    pickupLocations.forEach(location => {
        const button = $('<button type="button" class="btn btn-outline-info">' + location + '</button>');
        button.on('click', () => pickupInput.val(location));
        pickupButtonsDiv.append(button);
    });

    // --- Create Preset Buttons for Destination Locations ---
    destinationLocations.forEach(location => {
        const button = $('<button type="button" class="btn btn-outline-success">' + location + '</button>');
        button.on('click', () => destinationInput.val(location));
        destinationButtonsDiv.append(button);
    });

    // --- Calculate Fare ---
    function calculateFare(pickup, destination, passengers) {
        const route = `${pickup}-${destination}`;
        let fare = fares[route] || 0;
        fare = fare * (passengers || 1); // Basic fare per passenger
        return fare;
    }

    calculateButton.on('click', () => {
        const pickup = pickupInput.val().trim();
        const destination = destinationInput.val().trim();
        const passengers = parseInt(passengersInput.val()) || 1;
        const cashReceived = parseFloat(cashReceivedInput.val()) || 0;
    
        // Calculate the fare based on the route and number of passengers
        const fare = calculateFare(pickup, destination, passengers);
        const change = cashReceived - fare;
    
        // Display the calculated change
        if (fare > 0) {
            changeDisplay.text(`Change: R ${change.toFixed(2)}`);
            if (change < 0) {
                alert('Insufficient cash received.');
            } else {
                recordTransaction(cashReceived, passengers, destination, change, fare, pickup);
                cashReceivedInput.val('');
                pickupInput.val('');
                destinationInput.val('');
                passengersInput.val('');
            }
        } else if (pickup && destination) {
            alert('Fare not defined for this route.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    // --- Record Transaction ---
    function recordTransaction(cash, passengers, destination, change, fare, pickup) {
        const now = new Date();
        const transaction = {
            cashReceived: cash.toFixed(2),
            passengers: passengers,
            pickup: pickup,
            destination: destination,
            change: change.toFixed(2),
            fare: fare.toFixed(2),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            completed: false
        };
        transactions.push(transaction);
        saveTransactions();
        updateDailyEarnings(parseFloat(fare));
        displayTransactions();
        displayDailyEarnings();
    }

    // --- Mark Transaction as Complete ---
    function markComplete(index) {
        transactions[index].completed = true;
        saveTransactions();
        displayTransactions();
    }

    // --- Display Transactions ---
    function displayTransactions() {
        transactionList.empty();
        if (transactions.length === 0) {
            transactionList.append('<li class="list-group-item">No transactions recorded yet.</li>');
            return;
        }

        transactions.forEach((transaction, index) => {
            const listItem = $('<li class="list-group-item transaction-item"></li>');
            const details = $(`
                <div class="transaction-details">
                    <div>Cash: R ${transaction.cashReceived}</div>
                    <div>Passengers: ${transaction.passengers}</div>
                    <div>Destination: ${transaction.destination}</div>
                    <div>Change: R ${transaction.change}</div>
                    <small class="text-muted">${transaction.date} ${transaction.time}</small>
                </div>
            `);
            listItem.append(details);

            const actions = $('<div class="transaction-actions"></div>');
            const completeButton = $('<button class="btn btn-success btn-sm">' + (transaction.completed ? 'Completed' : 'Mark Complete') + '</button>');
            completeButton.prop('disabled', transaction.completed);
            completeButton.on('click', () => markComplete(index));
            actions.append(completeButton);
            listItem.append(actions);

            transactionList.append(listItem);
        });
    }

    // --- Local Storage ---
    function saveTransactions() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }

    function loadTransactions() {
        const storedTransactions = localStorage.getItem(STORAGE_KEY);
        return storedTransactions ? JSON.parse(storedTransactions) : [];
    }

    // --- Download Transactions ---
downloadButton.on('click', () => {
    if (transactions.length === 0) {
        alert('No transactions to download.');
        return;
    }

    // Create a text representation of the transactions
    let text = "Taxi Transaction History\n\n";
    transactions.forEach(t => {
        text += `Cash Received: R ${t.cashReceived}\n`;
        text += `Passengers: ${t.passengers}\n`;
        text += `Pickup: ${t.pickup}\n`;
        text += `Destination: ${t.destination}\n`;
        text += `Change: R ${t.change}\n`;
        text += `Fare: R ${t.fare}\n`;
        text += `Date: ${t.date}\n`;
        text += `Time: ${t.time}\n`;
        text += `Completed: ${t.completed ? 'Yes' : 'No'}\n`;
        text += "---\n";
    });

    // Get the current date for the file name
    const now = new Date();
    const dateStamp = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Create a Blob and download the file
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taxi_transactions_${dateStamp}.txt`; // Include the date in the file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

    // --- Daily Earnings ---
    function loadDailyEarnings() {
        const storedEarnings = localStorage.getItem(EARNINGS_KEY);
        return storedEarnings ? parseFloat(storedEarnings) : 0;
    }

    function saveDailyEarnings(earnings) {
        localStorage.setItem(EARNINGS_KEY, earnings.toFixed(2));
    }

    function updateDailyEarnings(amount) {
        dailyEarnings += amount;
        saveDailyEarnings(dailyEarnings);
        displayDailyEarnings();
    }

    function displayDailyEarnings() {
        dailyEarningsDisplay.text(`Total: R ${dailyEarnings.toFixed(2)}`);
    }

    resetEarningsButton.on('click', () => {
        if (confirm('Are you sure you want to reset daily earnings?')) {
            dailyEarnings = 0;
            saveDailyEarnings(dailyEarnings);
            displayDailyEarnings();
        }
    });

    // --- Autofill (Basic Implementation) ---
    pickupInput.on('input', () => {
        const query = pickupInput.val().trim().toLowerCase();
        const suggestions = pickupLocations.filter(loc => loc.toLowerCase().startsWith(query));
        // You can implement a more sophisticated UI for displaying suggestions (e.g., dropdown)
    });

    destinationInput.on('input', () => {
        const query = destinationInput.val().trim().toLowerCase();
        const suggestions = destinationLocations.filter(loc => loc.toLowerCase().startsWith(query));
        // Implement UI for destination suggestions
    });

    // Event listener for the "Reset Transactions" button
$('#reset-transactions').on('click', () => {
    if (confirm('Are you sure you want to reset all transactions?')) {
        transactions = []; // Clear the transactions array
        saveTransactions(); // Save the empty array to local storage
        displayTransactions(); // Refresh the transaction list
        alert('All transactions have been reset.');
    }
});
});