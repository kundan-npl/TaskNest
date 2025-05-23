import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TaskStatusChart = ({ taskStats }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'In Progress', 'Not Started', 'On Hold'],
        datasets: [{
          data: [
            taskStats.completed, 
            taskStats.inProgress, 
            taskStats.notStarted,
            taskStats.onHold
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)', // green
            'rgba(59, 130, 246, 0.6)', // blue
            'rgba(156, 163, 175, 0.6)', // gray
            'rgba(234, 179, 8, 0.6)'  // yellow
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(156, 163, 175, 1)',
            'rgba(234, 179, 8, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
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
  }, [taskStats]);

  return (
    <div className="h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default TaskStatusChart;
