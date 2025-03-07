import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Link,
  Icon,
  Flex,
  Heading,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import {
  MdDashboard,
  MdSettings,
  MdWaterDrop,
  MdOutlineScience,
  MdTableChart
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

const NavItem = ({ icon, children, to, active }) => {
  const bgColor = useColorModeValue('blackAlpha.50', 'whiteAlpha.50');
  const activeBgColor = useColorModeValue('spotify.green', 'spotify.green');
  const activeColor = useColorModeValue('white', 'white');
  const hoverBgColor = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const color = useColorModeValue('gray.800', 'white');

  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none', width: '100%' }}
    >
      <Flex
        align="center"
        p="3"
        mx="2"
        borderRadius="md"
        role="group"
        cursor="pointer"
        _hover={{
          bg: active ? activeBgColor : hoverBgColor,
        }}
        bg={active ? activeBgColor : 'transparent'}
        color={active ? activeColor : color}
        fontWeight={active ? 'bold' : 'normal'}
      >
        <Icon
          mr="4"
          fontSize="20"
          as={icon}
        />
        <Text fontSize="md">{children}</Text>
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      w={{ base: 'full', md: '250px' }}
      pos="fixed"
      h="full"
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      display={{ base: 'none', md: 'block' }}
      zIndex="10"
    >
      {/* Logo area */}
      <Flex h="20" alignItems="center" mx="8" mb="6" mt="4">
        <Heading
          fontSize="2xl"
          fontWeight="bold"
          color="spotify.green"
          display="flex"
          alignItems="center"
        >
          <Icon as={MdWaterDrop} mr={2} />
          Aquaponics
        </Heading>
      </Flex>

      {/* User info */}
      {user && (
        <Box px="8" mb="6">
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            Welcome
          </Text>
          <Text fontSize="md" fontWeight="bold" isTruncated>
            {user.name}
          </Text>
        </Box>
      )}

      <Divider mb="6" />

      {/* Nav Items */}
      <VStack spacing={1} align="stretch">
        <NavItem 
          icon={MdDashboard} 
          to="/" 
          active={location.pathname === '/'}
        >
          Dashboard
        </NavItem>
        
        <NavItem 
          icon={MdTableChart} 
          to="/telemetry" 
          active={location.pathname === '/telemetry'}
        >
          Telemetry Data
        </NavItem>
        
        <NavItem 
          icon={MdOutlineScience} 
          to="/analysis" 
          active={location.pathname === '/analysis' || location.pathname.startsWith('/analysis/')}
        >
          AI Analysis
        </NavItem>
        
        <NavItem 
          icon={MdSettings} 
          to="/settings" 
          active={location.pathname === '/settings'}
        >
          Settings
        </NavItem>
      </VStack>

      {/* Footer area */}
      <Box position="absolute" bottom="5" width="100%" px="8">
        <Text fontSize="xs" color="gray.500">
          Aquaponics Monitoring v1.0
        </Text>
      </Box>
    </Box>
  );
};

export default Sidebar;
