import { useDataSource } from '../Hooks/useDataSource';
import { Tabs, Tab } from '@heroui/react';
import { Key } from 'react'; 

const DataSourceSelector = () => {
  const { dataSource, setDataSource } = useDataSource();
  
  // Handle tab selection with the correct type
  const handleSelectionChange = (key: Key) => {
    // Convert the key to string before passing to setDataSource
    setDataSource(String(key) as 'antenna' | 'api');
  };
  
  return (
    <div className="flex w-full flex-col">
      <Tabs 
        aria-label="Options"
        selectedKey={dataSource}
        onSelectionChange={handleSelectionChange}
      >
        <Tab key="antenna" title="Antenna" />
        <Tab key="api" title="Api" />
      </Tabs>
    </div>
  );
};

export default DataSourceSelector;