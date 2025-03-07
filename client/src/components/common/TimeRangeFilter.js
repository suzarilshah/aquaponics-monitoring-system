import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  Flex,
  Text,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';

const TimeRangeFilter = ({ activeFilter, onChange }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('white', 'gray.800');
  const activeBgColor = useColorModeValue('green.500', 'green.400');
  const hoverBgColor = useColorModeValue('gray.200', 'gray.600');
  
  const filters = [
    { value: '10min', label: 'Last Hour', tooltip: 'View data from the last hour in 10-minute intervals' },
    { value: 'hour', label: 'Last 24h', tooltip: 'View data from the last 24 hours aggregated by hour' },
    { value: 'day', label: 'Last 7d', tooltip: 'View data from the last 7 days aggregated by day' },
    { value: 'week', label: 'Last 4w', tooltip: 'View data from the last 4 weeks aggregated by week' },
    { value: 'month', label: 'Last 6m', tooltip: 'View data from the last 6 months aggregated by month' },
    { value: '6m', label: 'Last 12m', tooltip: 'View data from the last 12 months aggregated by month' }
  ];
  
  return (
    <Flex align="center" mb={4}>
      <Text mr={3} fontWeight="medium">Time Range:</Text>
      <ButtonGroup size="sm" isAttached variant="outline" borderRadius="md" bg={bgColor}>
        {filters.map(filter => (
          <Tooltip key={filter.value} label={filter.tooltip} hasArrow placement="top">
            <Button
              value={filter.value}
              onClick={() => onChange(filter.value)}
              bg={activeFilter === filter.value ? activeBgColor : 'transparent'}
              color={activeFilter === filter.value ? activeColor : 'inherit'}
              _hover={{
                bg: activeFilter === filter.value 
                  ? activeBgColor 
                  : hoverBgColor
              }}
              borderRadius="md"
            >
              {filter.label}
            </Button>
          </Tooltip>
        ))}
      </ButtonGroup>
    </Flex>
  );
};

export default TimeRangeFilter;
