import { useMemo, useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

/**
 * options: [{ id: string|number, name: string }]
 * value: string|number (id) hoặc null
 */
export default function SearchableSelect({
  label,
  placeholder = 'Gõ để tìm...',
  options = [],
  value,
  onChange,
  disabled,
  errorText,
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = removeVN(query);
    return options.filter(o => removeVN(o.name).includes(q));
  }, [options, query]);

  const selected = useMemo(
    () => options.find(o => String(o.id) === String(value)) || null,
    [options, value]
  );

  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <Combobox value={selected} onChange={(opt) => onChange?.(opt?.id)} disabled={disabled}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white pr-10 focus-within:ring-2 focus-within:ring-primary-500">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 focus:outline-none"
              displayValue={(opt) => opt?.name || ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <FiChevronDown className="opacity-60" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {filtered.length === 0 ? (
                <div className="cursor-default select-none px-3 py-2 text-gray-500">
                  Không tìm thấy kết quả
                </div>
              ) : (
                filtered.map((opt) => (
                  <Combobox.Option
                    key={opt.id}
                    value={opt}
                    className={({ active }) =>
                      `relative cursor-pointer select-none px-3 py-2 ${
                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-800'
                      }`
                    }
                  >
                    {({ selected: isSelected }) => (
                      <div className="flex items-center gap-2">
                        {isSelected ? <FiCheck /> : <span className="w-4" />}
                        <span className={isSelected ? 'font-medium' : ''}>{opt.name}</span>
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {errorText && <p className="form-error mt-1">{errorText}</p>}
    </div>
  );
}

// Bỏ dấu tiếng Việt để tìm kiếm dễ hơn
function removeVN(str = '') {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
