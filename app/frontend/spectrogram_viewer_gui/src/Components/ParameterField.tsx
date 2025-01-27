import { Input } from '@heroui/input';

interface ParameterFieldProps {
  fieldType: string;
  numberOfFields: number;
  fieldNamesInOrder: Array<string>;
}

const ParameterField = ({
  fieldType,
  numberOfFields,
  fieldNamesInOrder,
}: ParameterFieldProps) => {
  const RenderInputField = (
    numberOfFields: number,
    fieldNamesInOrder: Array<string>
  ) => {
    return fieldNamesInOrder
      .slice(0, numberOfFields)
      .map((fieldname, index) => (
        <Input
          key={index}
          labelPlacement="inside"
          size="lg"
          label={fieldname}
          className="w-32"
        />
      ));
  };

  return (
    <div className="flex justify-start items-center w-auto h-36 border-4 border-gray-800 rounded-3xl bg-[#D9D9D9] p-2 space-x-2 relative">
      <h3 className="absolute top-0 left-0 p-2 ml-4">{fieldType}</h3>
      {RenderInputField(numberOfFields, fieldNamesInOrder)}
    </div>
  );
};

export default ParameterField;
