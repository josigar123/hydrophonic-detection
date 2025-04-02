import { createContext, Dispatch, SetStateAction } from 'react';

export type DataSource = 'antenna' | 'api';

export interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: Dispatch<SetStateAction<DataSource>>;
}


const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export default DataSourceContext;