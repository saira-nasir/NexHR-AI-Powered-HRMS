import React, { useState, useEffect, useCallback } from 'react';
import CreatableSelect from 'react-select/creatable';
import { MultiValue, ActionMeta, StylesConfig } from 'react-select';
import { skillsService, Skill } from '@/services/skillsService';
import { RequiredSkill } from '@/services/JobService';

interface RequiredSkillsFieldProps {
  value: RequiredSkill[];
  onChange: (skills: RequiredSkill[]) => void;
  validationError?: string;
  selectStyles: StylesConfig<any, boolean>;
}

interface SkillOption {
  value: string;
  label: string;
  id?: number;
  isNew?: boolean;
}

const RequiredSkillsField: React.FC<RequiredSkillsFieldProps> = ({
  value,
  onChange,
  validationError,
  selectStyles,
}) => {
  const [options, setOptions] = useState<SkillOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load initial skills
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading skills...');
      const skills = await skillsService.getAllSkills();
      console.log('Loaded skills:', skills);
      const skillOptions = skills.map(skill => ({
        value: skill.name,
        label: skill.name,
        id: skill.id,
      }));
      console.log('Mapped skill options:', skillOptions);
      setOptions(skillOptions);
    } catch (error) {
      console.error('Error loading skills:', error);
      setError('Failed to load skills. You can still create new ones.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search function
  const searchSkills = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        loadSkills();
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Searching skills with query:', query);
        const skills = await skillsService.searchSkills(query);
        console.log('Search results:', skills);
        const skillOptions = skills.map(skill => ({
          value: skill.name,
          label: skill.name,
          id: skill.id,
        }));
        console.log('Mapped search options:', skillOptions);
        setOptions(skillOptions);
      } catch (error) {
        console.error('Error searching skills:', error);
        setError('Failed to search skills. You can still create new ones.');
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Handle input change for search
  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);
    searchSkills(inputValue);
  };

  // Handle selection change
  const handleChange = (
    selectedOptions: MultiValue<SkillOption>,
    actionMeta: ActionMeta<SkillOption>
  ) => {
    const skills: RequiredSkill[] = selectedOptions.map(option => ({
      id: option.id,
      name: option.value,
    }));
    onChange(skills);
  };

  // Handle creation of new skill
  const handleCreateOption = async (inputValue: string) => {
    try {
      const newSkill = await skillsService.createSkill(inputValue);
      const newOption: SkillOption = {
        value: newSkill.name,
        label: newSkill.name,
        id: newSkill.id,
      };
      
      // Add to options
      setOptions(prev => [...prev, newOption]);
      
      // Add to current selection
      const currentSkills = value || [];
      onChange([...currentSkills, { id: newSkill.id, name: newSkill.name }]);
    } catch (error) {
      console.error('Error creating skill:', error);
      // Still add to selection even if creation fails
      const currentSkills = value || [];
      onChange([...currentSkills, { name: inputValue }]);
    }
  };

  // Convert current value to options format
  const selectedOptions: SkillOption[] = (value || []).map(skill => ({
    value: skill.name,
    label: skill.name,
    id: skill.id,
  }));

  // Debug logging
  console.log('RequiredSkillsField render - options:', options);
  console.log('RequiredSkillsField render - selectedOptions:', selectedOptions);
  console.log('RequiredSkillsField render - isLoading:', isLoading);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Required Skills <span className="text-red-500">*</span>
      </label>
      <CreatableSelect
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        onCreateOption={handleCreateOption}
        onInputChange={handleInputChange}
        options={options}
        isLoading={isLoading}
        placeholder={isLoading ? "Loading skills..." : "Search and select skills..."}
        classNamePrefix="select"
        isClearable
        isSearchable
        noOptionsMessage={() => "No skills found. Type to create a new skill."}
        styles={{
          ...selectStyles,
          control: (base) => ({
            ...base,
            backgroundColor: "#FFFFFF",
            borderColor: validationError ? "red" : "#DBD8E3",
            color: "#2A2438",
            minHeight: "42px",
            "&:hover": {
              borderColor: validationError ? "red" : "#DBD8E3",
            },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#DBD8E3",
            borderRadius: "6px",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "#2A2438",
            fontSize: "14px",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "#2A2438",
            "&:hover": {
              backgroundColor: "#5C5470",
              color: "white",
            },
          }),
        }}
      />
      {validationError && (
        <p className="text-red-500 text-xs mt-1">{validationError}</p>
      )}
      {error && (
        <p className="text-yellow-600 text-xs mt-1">{error}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Start typing to search existing skills or create new ones
      </p>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default RequiredSkillsField;
