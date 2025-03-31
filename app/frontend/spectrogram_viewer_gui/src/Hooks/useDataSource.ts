import { useContext } from 'react';
import DataSourceContext, { DataSourceContextType } from '../Contexts/DataSourceContext';

export function useDataSource(): DataSourceContextType {
  const context = useContext(DataSourceContext);
  
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  
  return context;
}

export default useDataSource;