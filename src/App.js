import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const tokens = {
    'OPN': {'contractAddress': '0x9A6d24c02eC35ad970287eE8296D4D6552a31DbE'},
    'TREE': {'contractAddress': '0x6888c2409D48222E2CB738eB5a805A522a96CE80'},
    'BORED': {'contractAddress': '0x70737489DFDf1A29b7584d40500d3561bD4Fe196'},
    'WTW': {'contractAddress': '0x88E2dA7B5dE075d4Cf4414e2D8162b51491461F8'},
    'TYBG': {'contractAddress': '0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE'},
    'BLEU': {'contractAddress': '0xBf4Db8b7A679F89Ef38125d5F84dd1446AF2ea3B'},
    'FARTHER': {'contractAddress': '0x8ad5b9007556749DE59E088c88801a3Aaa87134B'},
    'TERMINAL': {'contractAddress': '0xb488fCB23333e7bAA28D1dFd7B69a5D3a8BfeB3a'},
    'BUILD': {'contractAddress': '0x3C281A39944a2319aA653D81Cfd93Ca10983D234'},
    'HIGHER': {'contractAddress': '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe'},
    'TN100x': {'contractAddress': '0x5B5dee44552546ECEA05EDeA01DCD7Be7aa6144A'},
    'MIGGLES': {'contractAddress': '0xB1a03EdA10342529bBF8EB700a06C60441fEf25d'},
    'REFI': {'contractAddress': '0x7dbdBF103Bb03c6bdc584c0699AA1800566f0F84'}
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
};

const TokenInfoRow = ({ token, contractAddress, priceUsd, jobsPerHour, error, loading }) => {
    return (
        <tr>
            <td><a href={`https://kyberswap.com/swap/base/eth-to-${contractAddress}`} target="_blank" rel="noopener noreferrer">{token}</a></td>
            <td onClick={() => copyToClipboard(contractAddress)} style={{ cursor: 'pointer' }}>{contractAddress}</td>
            <td>{loading ? 'Loading...' : priceUsd}</td>
            <td className="centered">
                {loading ? 'Loading...' : error ? (
                    <span style={{ color: 'red' }}>{error}</span>
                ) : (
                    jobsPerHour !== null ? jobsPerHour : 'No data'
                )}
            </td>
        </tr>
    );
};

const App = () => {
    const [tokenData, setTokenData] = useState({});
    const [sortedTokenData, setSortedTokenData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Создаем соединение с WebSocket сервером
        const socket = io('wss://capy.bond', {
            transports: ['websockets', 'polling'],
            upgrade: false
        });

        // Логирование состояния соединения
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });
        
        // Слушаем событие 'price_update' от сервера
        socket.on('price_update', (newData) => {
            console.log('Received new price data:', newData); // Лог для проверки данных
            setTokenData((prevData) => ({
                ...prevData,
                [newData.token]: {
                    ...prevData[newData.token],
                    price: newData.price
                }
            }));
        });

        // Обработка события 'jobs_update'
        socket.on('jobs_update', (newData) => {
            console.log('Received jobs per hour update:', newData);
            setTokenData((prevData) => ({
                ...prevData,
                [newData.token]: {
                    ...prevData[newData.token],
                    jobs_per_hour: newData.jobs_per_hour
                }
            }));
        });        

        // Очищаем соединение при размонтировании компонента
        return () => {
            socket.disconnect();
        };
    }, []);    

    useEffect(() => {
        const fetchAllTokenInfo = async () => {
            try {
                const response = await fetch('/api/tokens');
                if (!response.ok) {
                    throw new Error(`Failed to fetch token data: ${response.statusText}`);
                }
                const data = await response.json();
                setTokenData(data);
                setLoading(false);
            } catch (err) {
                setError(`Error fetching data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchAllTokenInfo();
    }, []);

    useEffect(() => {
        if (!loading) {
            // Сортировка данных после загрузки
            const sortedData = Object.entries(tokenData).sort(
                ([, a], [, b]) => (b.jobs_per_hour || 0) - (a.jobs_per_hour || 0)
            );
            setSortedTokenData(sortedData);
        }
    }, [loading, tokenData]);

    return (
        <div className="App">
            <h1>Quick Math for Rebase (by @leonikaf.eth)</h1>
            <p><strong>All calcs are made with the amount of tokens equivalent to 10$</strong></p>

            <table>
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Contract Address</th>
                        <th>USD Price</th>
                        <th>Jobs per Hour</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Object.keys(tokens).map(token => (
                            <TokenInfoRow
                                key={token}
                                token={token}
                                contractAddress={tokens[token].contractAddress}
                                priceUsd={'Loading...'}
                                jobsPerHour={'Loading...'}
                                loading={true}
                            />
                        ))
                    ) : (
                        sortedTokenData.map(([token, data]) => (
                            <TokenInfoRow
                                key={token}
                                token={token}
                                contractAddress={tokens[token].contractAddress}
                                priceUsd={data.price}
                                jobsPerHour={data.jobs_per_hour.toFixed(2)}
                                loading={false}
                            />
                        ))
                    )}
                </tbody>
            </table>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <p><strong>Consider the price impact on the results! If buy x $bleu for 1000$ - be ready for significant drop in value</strong></p>
            <p><strong>These days I've made some upgrades to make the experience of staking these coins better for us</strong></p>
            <p><strong>If you would like to support the creator - you can tip me on warpcast, nominate via buildbot</strong></p>
            <p><strong>..or just send me money cause I'm broke af</strong></p>
        </div>
    );
};

export default App;
