import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionCategory } from '@/types/transaction';

interface CategorySelectorProps {
  categories: TransactionCategory[];
  value?: number;
  onChange: (value: number | undefined) => void;
}

export function CategorySelector({ categories, value, onChange }: CategorySelectorProps) {
  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(val ? parseInt(val) : undefined)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category">
          {value && (
            <div className="flex items-center gap-2">
              {categories.find(c => c.id === value)?.icon && (
                <span>{categories.find(c => c.id === value)?.icon}</span>
              )}
              <span>{categories.find(c => c.id === value)?.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">No category</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            <div className="flex items-center gap-2">
              {category.icon && <span>{category.icon}</span>}
              <span>{category.name}</span>
              {category.color && (
                <div
                  className="w-3 h-3 rounded-full ml-auto"
                  style={{ backgroundColor: category.color }}
                />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
