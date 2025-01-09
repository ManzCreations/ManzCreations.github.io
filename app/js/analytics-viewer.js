// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Base Card component
const Card = ({ children, className = '' }) => {
    return React.createElement('div', { 
        className: `bg-white rounded-lg shadow-lg p-6 ${className}` 
    }, children);
};

// Chart Card component
const ChartCard = ({ title, children, className = '' }) => {
    return React.createElement(Card, { 
        className: `${className} h-96` 
    }, [
        React.createElement('h3', { 
            className: 'text-lg font-semibold text-gray-600 mb-4',
            key: 'title'
        }, title),
        children
    ]);
};

const AnalyticsDashboard = () => {
    const [data, setData] = React.useState(null);
    const [timeRange, setTimeRange] = React.useState('all');
    const [loading, setLoading] = React.useState(true);
    const trafficChartRef = React.useRef(null);
    const deviceChartRef = React.useRef(null);
    const trafficCanvasRef = React.useRef(null);
    const deviceCanvasRef = React.useRef(null);

    const destroyCharts = () => {
        if (trafficChartRef.current) {
            trafficChartRef.current.destroy();
            trafficChartRef.current = null;
        }
        if (deviceChartRef.current) {
            deviceChartRef.current.destroy();
            deviceChartRef.current = null;
        }
    };

    const createCharts = (timelineData, deviceData) => {
        if (trafficCanvasRef.current && !trafficChartRef.current) {
            trafficChartRef.current = new Chart(trafficCanvasRef.current, {
                type: 'line',
                data: {
                    labels: timelineData.map(d => d.date),
                    datasets: [{
                        label: 'Page Views',
                        data: timelineData.map(d => d.views),
                        borderColor: '#0088FE',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        if (deviceCanvasRef.current && !deviceChartRef.current) {
            deviceChartRef.current = new Chart(deviceCanvasRef.current, {
                type: 'pie',
                data: {
                    labels: deviceData.map(d => d.name),
                    datasets: [{
                        data: deviceData.map(d => d.value),
                        backgroundColor: COLORS
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    };

    React.useEffect(() => {
        loadAnalytics();
        const interval = setInterval(loadAnalytics, 300000); // Refresh every 5 minutes
        return () => {
            clearInterval(interval);
            destroyCharts();
        };
    }, []);

    React.useEffect(() => {
        if (data) {
            // Prepare chart data
            const timelineData = Object.entries(data.dailyStats || {}).map(([date, stats]) => ({
                date,
                views: stats.views || 0
            })).sort((a, b) => new Date(a.date) - new Date(b.date));

            const deviceData = Object.entries(data.deviceTypes || {}).map(([device, count]) => ({
                name: device,
                value: count
            }));

            destroyCharts();
            createCharts(timelineData, deviceData);
        }
    }, [data]);

    const loadAnalytics = async () => {
        try {
            const jsonResponse = await window.fs.readFile('analytics.json');
            const analyticsData = JSON.parse(jsonResponse);
            setData(analyticsData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading analytics:', error);
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm('Are you sure you want to reset all analytics data? This cannot be undone.')) {
            try {
                await window.analyticsTracker.resetAnalytics();
                await loadAnalytics();
                alert('Analytics data has been reset successfully.');
            } catch (error) {
                console.error('Error resetting analytics:', error);
                alert('Failed to reset analytics data.');
            }
        }
    };

    if (loading) {
        return React.createElement('div', { 
            className: 'flex items-center justify-center min-h-screen' 
        }, 
            React.createElement('div', { 
                className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500' 
            })
        );
    }

    if (!data) {
        return React.createElement('div', { 
            className: 'text-center p-8 text-gray-500' 
        }, 'No analytics data available');
    }

    // Format numbers with commas
    const formatNumber = (num) => {
        return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Calculate time-based stats
    const getTimeFilteredStats = () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        return {
            today: data.dailyStats?.[today]?.views || 0,
            week: Object.entries(data.dailyStats || {})
                .filter(([date]) => date >= weekAgo)
                .reduce((sum, [, stats]) => sum + (stats.views || 0), 0),
            month: Object.entries(data.dailyStats || {})
                .filter(([date]) => date >= monthAgo)
                .reduce((sum, [, stats]) => sum + (stats.views || 0), 0)
        };
    };

    const timeStats = getTimeFilteredStats();

    // Prepare timeline data
    const timelineData = Object.entries(data.dailyStats || {}).map(([date, stats]) => ({
        date,
        views: stats.views || 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare device distribution data
    const deviceData = Object.entries(data.deviceTypes || {}).map(([device, count]) => ({
        name: device,
        value: count
    }));

    // Create main container
    return React.createElement('div', { 
        className: 'min-h-screen bg-gray-100 p-6' 
    },
        React.createElement('div', { 
            className: 'max-w-7xl mx-auto' 
        },
            // Header
            React.createElement('div', { 
                className: 'flex justify-between items-center mb-8' 
            },
                React.createElement('h1', { 
                    className: 'text-3xl font-bold text-gray-800' 
                }, 'Website Analytics Dashboard'),
                React.createElement('div', { 
                    className: 'flex gap-4' 
                },
                    React.createElement('select', {
                        className: 'px-4 py-2 rounded border',
                        value: timeRange,
                        onChange: (e) => setTimeRange(e.target.value)
                    },
                        React.createElement('option', { value: 'all' }, 'All Time'),
                        React.createElement('option', { value: 'today' }, 'Today'),
                        React.createElement('option', { value: 'week' }, 'This Week'),
                        React.createElement('option', { value: 'month' }, 'This Month')
                    ),
                    React.createElement('button', {
                        onClick: loadAnalytics,
                        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, 'Refresh Data'),
                    React.createElement('button', {
                        onClick: handleReset,
                        className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                    }, 'Reset Analytics')
                )
            ),

            // Overview Cards
            React.createElement('div', { 
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8' 
            },
                React.createElement(Card, null,
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-2' 
                    }, 'Total Views'),
                    React.createElement('p', { 
                        className: 'text-3xl font-bold' 
                    }, formatNumber(data.totalViews)),
                    React.createElement('p', { 
                        className: 'text-sm text-gray-500 mt-2' 
                    }, `Today: ${formatNumber(timeStats.today)}`)
                ),
                React.createElement(Card, null,
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-2' 
                    }, 'This Week'),
                    React.createElement('p', { 
                        className: 'text-3xl font-bold' 
                    }, formatNumber(timeStats.week))
                ),
                React.createElement(Card, null,
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-2' 
                    }, 'This Month'),
                    React.createElement('p', { 
                        className: 'text-3xl font-bold' 
                    }, formatNumber(timeStats.month))
                ),
                React.createElement(Card, null,
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-2' 
                    }, 'Regions'),
                    React.createElement('p', { 
                        className: 'text-3xl font-bold' 
                    }, formatNumber(Object.keys(data.regions || {}).length))
                )
            ),

            // Charts Section
            React.createElement('div', { 
                className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8' 
            },
                // Traffic Line Chart
                React.createElement(ChartCard, { 
                    title: 'Traffic Over Time',
                    key: 'traffic-chart'
                },
                    React.createElement('canvas', { 
                        ref: trafficCanvasRef,
                        id: 'trafficChart'
                    })
                ),

                // Device Distribution Pie Chart
                React.createElement(ChartCard, { 
                    title: 'Device Distribution',
                    key: 'device-chart'
                },
                    React.createElement('canvas', { 
                        ref: deviceCanvasRef,
                        id: 'deviceChart'
                    })
                )
            ),

            // Email Inquiries Section
            data.emailInquiries && React.createElement('div', { className: 'mb-8' },
                React.createElement('h2', { 
                    className: 'text-2xl font-bold text-gray-800 mb-6' 
                }, 'Email Inquiries'),
                
                React.createElement('div', { 
                    className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' 
                },
                    React.createElement(Card, null,
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-600 mb-2' 
                        }, 'Total Inquiries'),
                        React.createElement('p', { 
                            className: 'text-3xl font-bold' 
                        }, formatNumber(data.emailInquiries.total))
                    ),
                    React.createElement(Card, null,
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-600 mb-2' 
                        }, 'Quick Inquiries'),
                        React.createElement('p', { 
                            className: 'text-3xl font-bold' 
                        }, formatNumber(data.emailInquiries.types?.quick || 0))
                    ),
                    React.createElement(Card, null,
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-600 mb-2' 
                        }, 'Full Inquiries'),
                        React.createElement('p', { 
                            className: 'text-3xl font-bold' 
                        }, formatNumber(data.emailInquiries.types?.full || 0))
                    )
                ),
                
                React.createElement(Card, { className: 'mt-6' },
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-4' 
                    }, 'Recent Inquiries'),
                    React.createElement('div', { className: 'space-y-3' },
                        (data.emailInquiries.history || [])
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .slice(0, 10)
                            .map((inquiry, index) =>
                                React.createElement('div', {
                                    key: index,
                                    className: 'flex justify-between items-center border-b pb-2'
                                },
                                    React.createElement('span', { className: 'font-medium' },
                                        `${new Date(inquiry.timestamp).toLocaleString()} - ${inquiry.type}`
                                    ),
                                    React.createElement('span', { className: 'text-gray-600' },
                                        Array.isArray(inquiry.productType) 
                                            ? inquiry.productType.join(', ')
                                            : inquiry.productType
                                    )
                                )
                            )
                    )
                )
            ),

            // Detailed Stats Sections
            React.createElement('div', { 
                className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8' 
            },
                // Page Views Card
                React.createElement(Card, { className: 'lg:col-span-1' },
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-4' 
                    }, 'Page Views'),
                    React.createElement('div', { 
                        className: 'space-y-3' 
                    },
                        Object.entries(data.pageViews || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([page, views]) =>
                                React.createElement('div', {
                                    key: page,
                                    className: 'flex justify-between items-center border-b pb-2'
                                },
                                    React.createElement('span', { 
                                        className: 'font-medium' 
                                    }, page || '/'),
                                    React.createElement('span', { 
                                        className: 'text-gray-600' 
                                    }, `${formatNumber(views)} views`)
                                )
                            )
                    )
                ),

                // Regions Card
                React.createElement(Card, { className: 'lg:col-span-1' },
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-4' 
                    }, 'Regions'),
                    React.createElement('div', { 
                        className: 'space-y-3' 
                    },
                        Object.entries(data.regions || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([region, count]) =>
                                React.createElement('div', {
                                    key: region,
                                    className: 'flex justify-between items-center border-b pb-2'
                                },
                                    React.createElement('span', {className: 'font-medium' 
                                    }, region),
                                    React.createElement('span', { 
                                        className: 'text-gray-600' 
                                    }, `${formatNumber(count)} visitors`)
                                )
                            )
                    )
                ),

                // Device Types Card
                React.createElement(Card, { className: 'lg:col-span-1' },
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-4' 
                    }, 'Device Types'),
                    React.createElement('div', { 
                        className: 'space-y-3' 
                    },
                        Object.entries(data.deviceTypes || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([device, count]) =>
                                React.createElement('div', {
                                    key: device,
                                    className: 'flex justify-between items-center border-b pb-2'
                                },
                                    React.createElement('span', { 
                                        className: 'font-medium' 
                                    }, device),
                                    React.createElement('span', { 
                                        className: 'text-gray-600' 
                                    }, `${formatNumber(count)} users`)
                                )
                            )
                    )
                ),

                // Referrers Card
                React.createElement(Card, { className: 'lg:col-span-1' },
                    React.createElement('h3', { 
                        className: 'text-lg font-semibold text-gray-600 mb-4' 
                    }, 'Top Referrers'),
                    React.createElement('div', { 
                        className: 'space-y-3' 
                    },
                        Object.entries(data.referrers || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([referrer, count]) =>
                                React.createElement('div', {
                                    key: referrer,
                                    className: 'flex justify-between items-center border-b pb-2'
                                },
                                    React.createElement('span', { 
                                        className: 'font-medium' 
                                    }, referrer),
                                    React.createElement('span', { 
                                        className: 'text-gray-600' 
                                    }, `${formatNumber(count)} referrals`)
                                )
                            )
                    )
                )
            )
        )
    );
};

// Mount the application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(AnalyticsDashboard));