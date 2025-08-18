import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import * as React from "react";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Selecionar...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "Nenhum item encontrado.",
    className,
    disabled = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Filtrar opções baseado na busca
    const filteredOptions = React.useMemo(() => {
        if (!searchValue) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [options, searchValue]);

    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (optionValue: string) => {
        console.log('🔵 Combobox handleSelect called:', {
            optionValue,
            currentValue: value,
            onValueChangeDefined: !!onValueChange
        });

        onValueChange?.(optionValue);
        setOpen(false);
        setSearchValue(""); // Limpar busca após seleção
    };

    // Debug: Log quando as props mudam
    React.useEffect(() => {
        console.log('🟡 Combobox props changed:', {
            value,
            optionsCount: options.length,
            firstOption: options[0],
            onValueChangeDefined: !!onValueChange
        });
    }, [value, options, onValueChange]);

    return (
        <Popover open={open} onOpenChange={(newOpen) => {
            console.log('🟣 Popover open state changing:', { from: open, to: newOpen });
            setOpen(newOpen);
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:bg-blue-light hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                    onClick={() => {
                        console.log('🟢 Trigger button clicked, current open:', open);
                    }}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="dropdown-fix w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="border-0">
                    {/* Campo de busca customizado */}
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus:ring-0"
                            onClick={(e) => {
                                console.log('⚪ Search input clicked');
                                e.stopPropagation();
                            }}
                            onFocus={() => console.log('⚫ Search input focused')}
                        />
                    </div>

                    {/* Lista de opções customizada */}
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div>
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={(e) => {
                                            console.log('🔴 Item clicked:', { option, e });
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        onMouseDown={(e) => {
                                            console.log('🟠 Item mousedown:', option);
                                            e.preventDefault(); // Prevenir que o Popover feche antes do onClick
                                        }}
                                        className="dropdown-item-fix relative flex w-full cursor-pointer select-none items-center py-2.5 pl-8 pr-3 text-sm outline-none hover:bg-blue-light hover:text-primary rounded-md transition-colors"
                                        style={{ minHeight: '40px' }} // Garantir área clicável mínima
                                    >
                                        <Check
                                            className={cn(
                                                "absolute left-2 h-4 w-4 text-primary pointer-events-none",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate pointer-events-none">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}