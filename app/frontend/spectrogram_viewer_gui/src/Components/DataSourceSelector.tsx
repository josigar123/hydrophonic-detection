import { useDataSource} from '../Hooks/useDataSource';
import {Button, ButtonGroup} from '@heroui/react'

const DataSourceSelector = () => {
  const { dataSource, setDataSource } = useDataSource();
  return (
    <ButtonGroup
    variant = "faded"
    color = "primary"
    size = "sm">
        <Button
        onPress={() => setDataSource('antenna')}>Local Antenna</Button>
        <Button
        onPress={() => setDataSource('api')}>Api</Button>
    </ButtonGroup>
  )
};

export default DataSourceSelector;