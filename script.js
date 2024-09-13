const API_KEYS = ['DA35N7MYY3LK6SUT', '17D8TPL0KK6ELN9O', 'MRCQZ6SE7S4ACESQ']; // Array of Alpha Vantage API keys
let currentApiKeyIndex = 0; // Index to track the current API key being used

async function fetchStockPrice(stockCode) {
    try {
        const apiKey = API_KEYS[currentApiKeyIndex];
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockCode}.BSE&apikey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch stock price. Network error.');
        }
        
        const data = await response.json();
        
        if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
            throw new Error('Invalid response received from Alpha Vantage. Please check your stock code.');
        }
        
        return parseFloat(data['Global Quote']['05. price']);
    } catch (error) {
        // If current API key fails, try the next one
        if (currentApiKeyIndex < API_KEYS.length - 1) {
            currentApiKeyIndex++;
            console.log(`Trying next API key. Index: ${currentApiKeyIndex}`);
            return fetchStockPrice(stockCode); // Retry with the next API key
        } else {
            throw new Error(`Error fetching stock price: ${error.message}`);
        }
    }
}

async function calculateFreeStock() {
    const stockCode = document.getElementById('stockCode').value.toUpperCase();
    const numShares = document.getElementById('numShares').value;
    const buyPrice = document.getElementById('buyPrice').value;

    if (!stockCode || !numShares || !buyPrice) {
        alert('Please fill out all fields.');
        return;
    }

    try {
        const latestPrice = await fetchStockPrice(stockCode);
        const totalInvested = numShares * buyPrice;
        const totalProfit = latestPrice * numShares - totalInvested;

        if (totalProfit < 0) {
            document.getElementById('investmentStatus').textContent = 'Sorry, your investment is in net loss.';
            document.getElementById('quote').innerHTML = '<em>Good things come to those who wait.</em>';
            return; // Exit early if in net loss
        }

        let sharesToSell = 0;

        if (totalProfit < latestPrice) {
            sharesToSell = 0;
            document.getElementById('sharesToSell').innerHTML = `Cannot sell shares to recover investment at current market conditions.<br>The profit earned is less than the last traded price.<br><br><em>- Good things come to those who wait.</em>`;
        } else {
            sharesToSell = Math.floor(totalInvested / latestPrice);
            if (sharesToSell === 0) {
                sharesToSell = 1;
            }
            document.getElementById('sharesToSell').textContent = `Shares to Sell to Recover Investment: ${sharesToSell}`;
        }

        document.getElementById('latestPrice').textContent = `LTP: ₹${latestPrice.toFixed(2)}`;

    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // Reset currentApiKeyIndex after each calculation attempt
        currentApiKeyIndex = 0;
    }
}
