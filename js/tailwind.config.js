// Configuración de Tailwind CSS para Panama AZORD
try {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          'montserrat': ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'scale-in': 'scaleIn 0.2s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
          }
        }
      }
    }
  };
  console.log('Tailwind config cargado correctamente');
} catch (error) {
  console.error('Error cargando Tailwind config:', error);
}