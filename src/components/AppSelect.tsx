import Select, { type SingleValue } from 'react-select';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  isSearchable?: boolean;
}

export default function AppSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  isDisabled = false,
  isSearchable = true,
}: AppSelectProps) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Select<AppSelectOption>
      inputId={id}
      unstyled
      isDisabled={isDisabled}
      isSearchable={isSearchable}
      value={selected}
      onChange={(opt: SingleValue<AppSelectOption>) => onChange(opt?.value ?? '')}
      options={options}
      placeholder={placeholder}
      noOptionsMessage={() => 'Tidak ada pilihan'}
      classNames={{
        control: (state) =>
          `rounded-full border bg-white px-1 py-0 text-sm text-maroon-900 shadow-none transition dark:bg-maroon-900 dark:text-cream-50 ${
            state.isFocused
              ? 'border-maroon-400 ring-1 ring-maroon-300'
              : 'border-maroon-200 dark:border-maroon-700'
          } ${state.isDisabled ? 'opacity-60' : ''}`,
        valueContainer: () => 'px-3 py-2',
        placeholder: () => 'text-maroon-400 dark:text-cream-100/40',
        singleValue: () => 'text-maroon-900 dark:text-cream-50',
        input: () => 'text-maroon-900 dark:text-cream-50',
        indicatorsContainer: () => 'text-maroon-400 dark:text-cream-100/40',
        dropdownIndicator: () => 'px-2 py-1 hover:text-maroon-600 dark:hover:text-cream-100',
        clearIndicator: () => 'px-1 py-1 hover:text-blush-600',
        indicatorSeparator: () => 'hidden',
        menu: () =>
          'z-20 mt-2 overflow-hidden rounded-2xl border border-maroon-200 bg-white shadow-lg dark:border-maroon-700 dark:bg-maroon-800',
        menuList: () => 'py-1 max-h-60',
        option: (state) =>
          `cursor-pointer px-4 py-2 text-sm ${
            state.isSelected
              ? 'bg-maroon-800 text-cream-50 dark:bg-cream-100 dark:text-maroon-900'
              : state.isFocused
              ? 'bg-maroon-100 text-maroon-900 dark:bg-maroon-700 dark:text-cream-50'
              : 'text-maroon-800 dark:text-cream-100'
          }`,
        noOptionsMessage: () => 'px-4 py-3 text-sm text-maroon-400 dark:text-cream-100/40',
      }}
    />
  );
}
