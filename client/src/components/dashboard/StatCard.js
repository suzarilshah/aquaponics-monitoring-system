import React from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MdWaterDrop, 
  MdDeviceThermostat, 
  MdFilterAlt, 
  MdOpacity,
  MdElectricBolt,
  MdAir,
  MdWater,
} from 'react-icons/md';
import { WiHumidity, WiBarometer } from 'react-icons/wi';

// Map iconType to corresponding icon component
const getIcon = (iconType) => {
  switch (iconType) {
    case 'ph':
      return MdWaterDrop;
    case 'temperature':
      return MdDeviceThermostat;
    case 'tds':
      return MdFilterAlt;
    case 'turbidity':
      return MdOpacity;
    case 'ec':
      return MdElectricBolt;
    case 'humidity':
      return WiHumidity;
    case 'pressure':
      return WiBarometer;
    default:
      return MdWater;
  }
};

// Get colors for each icon type
const getIconColor = (iconType) => {
  switch (iconType) {
    case 'ph':
      return 'purple.500';
    case 'temperature':
      return 'red.500';
    case 'tds':
      return 'blue.500';
    case 'turbidity':
      return 'gray.500';
    case 'ec':
      return 'yellow.500';
    case 'humidity':
      return 'cyan.500';
    case 'pressure':
      return 'orange.500';
    default:
      return 'blue.500';
  }
};

const StatCard = ({ title, value, unit, iconType, isWarning = false, bgColor }) => {
  const warningColor = useColorModeValue('red.500', 'red.300');
  const normalColor = useColorModeValue('gray.600', 'gray.200');
  const warningBgColor = useColorModeValue('red.50', 'rgba(254, 178, 178, 0.16)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const IconComponent = getIcon(iconType);
  const iconColor = getIconColor(iconType);

  return (
    <Box
      p={4}
      bg={isWarning ? warningBgColor : bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isWarning ? warningColor : borderColor}
      boxShadow="sm"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color={isWarning ? warningColor : normalColor} fontWeight="medium">
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={isWarning ? warningColor : 'spotify.green'}>
            {value || '—'}
          </StatNumber>
          <StatHelpText mb={0}>{unit}</StatHelpText>
        </Stat>
        
        <Icon
          as={IconComponent}
          boxSize={{ base: '1.5em', md: '2em' }}
          color={isWarning ? warningColor : iconColor}
          opacity={0.8}
        />
      </Flex>
    </Box>
  );
};

export default StatCard;
