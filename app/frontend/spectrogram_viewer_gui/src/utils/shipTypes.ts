// Standard ship type codes based on AIS standards
// Reference: https://www.navcen.uscg.gov/?pageName=AISMessagesA

export const shipTypeMap: Record<string, string> = {
    // Special craft
    '0': 'Not available',
    '1': 'Reserved',
    '2': 'Reserved',
    '3': 'Reserved',
    '4': 'Reserved',
    '5': 'Reserved',
    '6': 'Reserved',
    '7': 'Reserved',
    '8': 'Reserved',
    '9': 'Reserved',
    
    // Standard vessels
    '10': 'Reserved',
    '11': 'Reserved',
    '12': 'Reserved',
    '13': 'Reserved',
    '14': 'Reserved',
    '15': 'Reserved',
    '16': 'Reserved',
    '17': 'Reserved',
    '18': 'Reserved',
    '19': 'Reserved',
    
    // WIG (Wing in ground)
    '20': 'Wing in ground (WIG)',
    '21': 'Wing in ground (WIG) - Hazardous category A',
    '22': 'Wing in ground (WIG) - Hazardous category B',
    '23': 'Wing in ground (WIG) - Hazardous category C',
    '24': 'Wing in ground (WIG) - Hazardous category D',
    '25': 'Wing in ground (WIG) - Reserved',
    '26': 'Wing in ground (WIG) - Reserved',
    '27': 'Wing in ground (WIG) - Reserved',
    '28': 'Wing in ground (WIG) - Reserved',
    '29': 'Wing in ground (WIG) - Reserved',
    
    // Fishing vessels
    '30': 'Fishing',
    '31': 'Towing',
    '32': 'Towing (large)',
    '33': 'Dredging',
    '34': 'Diving',
    '35': 'Military',
    '36': 'Sailing',
    '37': 'Pleasure craft',
    '38': 'Reserved',
    '39': 'Reserved',
    
    // High-speed craft
    '40': 'High-speed craft (HSC)',
    '41': 'High-speed craft (HSC) - Hazardous category A',
    '42': 'High-speed craft (HSC) - Hazardous category B',
    '43': 'High-speed craft (HSC) - Hazardous category C',
    '44': 'High-speed craft (HSC) - Hazardous category D',
    '45': 'High-speed craft (HSC) - Reserved',
    '46': 'High-speed craft (HSC) - Reserved',
    '47': 'High-speed craft (HSC) - Reserved',
    '48': 'High-speed craft (HSC) - Reserved',
    '49': 'High-speed craft (HSC) - No additional information',
    
    // Passenger vessels
    '50': 'Pilot vessel',
    '51': 'Search and rescue vessel',
    '52': 'Tug',
    '53': 'Port tender',
    '54': 'Anti-pollution equipment',
    '55': 'Law enforcement',
    '56': 'Spare - Reserved',
    '57': 'Spare - Reserved',
    '58': 'Medical transport',
    '59': 'Noncombatant ship',
    
    // Cargo vessels
    '60': 'Passenger ship',
    '61': 'Passenger ship - Hazardous category A',
    '62': 'Passenger ship - Hazardous category B',
    '63': 'Passenger ship - Hazardous category C',
    '64': 'Passenger ship - Hazardous category D',
    '65': 'Passenger ship - Reserved',
    '66': 'Passenger ship - Reserved',
    '67': 'Passenger ship - Reserved',
    '68': 'Passenger ship - Reserved',
    '69': 'Passenger ship - No additional information',
    
    // Cargo vessels
    '70': 'Cargo ship',
    '71': 'Cargo ship - Hazardous category A',
    '72': 'Cargo ship - Hazardous category B',
    '73': 'Cargo ship - Hazardous category C',
    '74': 'Cargo ship - Hazardous category D',
    '75': 'Cargo ship - Reserved',
    '76': 'Cargo ship - Reserved',
    '77': 'Cargo ship - Reserved',
    '78': 'Cargo ship - Reserved',
    '79': 'Cargo ship - No additional information',
    
    // Tankers
    '80': 'Tanker',
    '81': 'Tanker - Hazardous category A',
    '82': 'Tanker - Hazardous category B',
    '83': 'Tanker - Hazardous category C',
    '84': 'Tanker - Hazardous category D',
    '85': 'Tanker - Reserved',
    '86': 'Tanker - Reserved',
    '87': 'Tanker - Reserved',
    '88': 'Tanker - Reserved',
    '89': 'Tanker - No additional information',
    
    // Other types
    '90': 'Other type',
    '91': 'Other type - Hazardous category A',
    '92': 'Other type - Hazardous category B',
    '93': 'Other type - Hazardous category C',
    '94': 'Other type - Hazardous category D',
    '95': 'Other type - Reserved',
    '96': 'Other type - Reserved',
    '97': 'Other type - Reserved',
    '98': 'Other type - Reserved',
    '99': 'Other type - No additional information'
  };
  
  /**
   * Converts a ship type code to a readable description
   * @param typeCode The AIS ship type code as a string
   * @returns A human-readable ship type description
   */
  export const getShipTypeDescription = (typeCode: string | undefined): string => {
    if (!typeCode) return 'Unknown';
    
    // Normalize the type code
    const normalizedCode = typeCode.trim();
    
    // Return the mapped value or 'Unknown' if not found
    return shipTypeMap[normalizedCode] || `Unknown (${normalizedCode})`;
  };