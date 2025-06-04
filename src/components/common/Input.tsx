import React, { forwardRef } from 'react';

type InputProps = {
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  id: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      type = 'text',
      error,
      id,
      name,
      value,
      onChange,
      required = false,
      disabled = false,
      className = '',
    },
    ref
  ) => {
    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-black ml-1">*</span>}
          </label>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          ref={ref}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-1 focus:ring-black transition-colors ${
            disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
          }`}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;