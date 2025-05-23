import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TaskCompletionChart = ({ weeklyData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyData.map(item => item.day),
        datasets: [
          {
            label: 'Completed Tasks',
            data: weeklyData.map(item => item.completed),
            backgroundColor: 'rgba(34, 197, 94, 0.6)', // green
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: 'Created Tasks',
            data: weeklyData.map(item => item.created),
            backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              footer: (tooltipItems) => {
                const item = tooltipItems[0];
                const dataIndex = item.dataIndex;
                const day = weeklyData[dataIndex].day;
                const completion = weeklyData[dataIndex].completion;
                return `Completion rate: ${completion}%`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [weeklyData]);

  return (
    <div className="h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default TaskCompletionChart;
