import { extendTheme } from '@chakra-ui/react';

// Spotify-inspired theme with dark and light mode colors
export const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  fonts: {
    heading: `'Manrope', sans-serif`,
    body: `'Manrope', sans-serif`,
  },
  colors: {
    brand: {
      50: '#e6f2ff',
      100: '#c2d9ff',
      200: '#9bc1ff',
      300: '#71a9ff',
      400: '#4992ff',
      500: '#1DB954', // Spotify green
      600: '#158E3A', // Darker green
      700: '#0D682A', // Even darker green
      800: '#074719', // Very dark green
      900: '#022B0F', // Almost black green
    },
    spotify: {
      green: '#1DB954',
      black: '#191414',
      white: '#FFFFFF',
      gray: '#B3B3B3',
      darkgray: '#535353',
      lightgray: '#b3b3b3',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        bg: props.colorMode === 'dark' ? 'spotify.black' : 'white',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '50px', // Spotify uses rounded buttons
      },
      variants: {
        solid: (props) => ({
          bg: 'spotify.green',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.400',
          },
        }),
        outline: (props) => ({
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'white' : 'gray.800',
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
          },
        }),
        ghost: (props) => ({
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100',
          },
        }),
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: '10px',
          boxShadow: 'md',
        },
      }),
    },
    Input: {
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
            borderRadius: '4px',
            _focus: {
              borderColor: 'spotify.green',
              boxShadow: `0 0 0 1px var(--chakra-colors-spotify-green)`,
            },
          },
        }),
      },
    },
  },
});
