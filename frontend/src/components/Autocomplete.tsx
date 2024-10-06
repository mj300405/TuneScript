import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TITLE_SUGGESTIONS, GET_COMPOSER_SUGGESTIONS, GET_PLAYER_SUGGESTIONS } from '../lib/queries';

interface AutocompleteProps {
  field: 'title' | 'composer' | 'player';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const Autocomplete: React.FC<AutocompleteProps> = ({ field, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const query = {
    title: GET_TITLE_SUGGESTIONS,
    composer: GET_COMPOSER_SUGGESTIONS,
    player: GET_PLAYER_SUGGESTIONS
  }[field];

  const { data, loading } = useQuery(query, {
    variables: { prefix: inputValue },
    skip: inputValue.length < 2,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const suggestions = data ? data[`get${field.charAt(0).toUpperCase() + field.slice(1)}Suggestions`] : [];

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="border p-2 mb-2 w-full rounded"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
          {suggestions.map((suggestion: string, index: number) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;