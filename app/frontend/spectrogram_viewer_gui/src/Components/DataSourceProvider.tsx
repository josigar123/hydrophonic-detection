import { ReactNode, useState } from 'react';
import DataSourceContext, { DataSource } from '../Contexts/DataSourceContext';

interface DataSourceProviderProps {
  children: ReactNode;
  initialDataSource?: DataSource;
}

export function DataSourceProvider({
  children,
  initialDataSource = 'antenna'
}: DataSourceProviderProps) {
  const [dataSource, setDataSource] = useState<DataSource>(initialDataSource);
  
  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export default DataSourceProvider;