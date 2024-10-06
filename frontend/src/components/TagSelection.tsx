import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';

export const GET_ALL_TAGS = gql`
  query GetAllTags {
    allTags {
      id
      name
    }
  }
`;

const TagSelection: React.FC<{ onTagsChange: (tagIds: number[]) => void }> = ({ onTagsChange }) => {
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const { data, loading, error } = useQuery(GET_ALL_TAGS);

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags, onTagsChange]);

  if (loading) return <p>Loading tags...</p>;
  if (error) return <p>Error loading tags: {error.message}</p>;

  return (
    <div>
      {data.allTags.map((tag: { id: number, name: string }) => (
        <button
          key={tag.id}
          onClick={() => handleTagToggle(tag.id)}
          className={`m-1 p-1 border rounded ${selectedTags.includes(tag.id) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
};

export default TagSelection;