"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import type { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import type { DataTableFilterField } from "./types";

interface DataTableFilterCommandProps<TData, TSchema extends z.ZodObject<any>> {
  table: Table<TData>;
  filterFields?: DataTableFilterField<TData>[];
  schema: TSchema;
  isLoading?: boolean;
}

export function DataTableFilterCommand<TData, TSchema extends z.ZodObject<any>>({
  table,
  filterFields,
  schema,
  isLoading,
}: DataTableFilterCommandProps<TData, TSchema>) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");

  const commandFields = React.useMemo(() => (
    filterFields?.filter((field) => !field.commandDisabled) ?? []
  ), [filterFields]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          <span className="truncate">
            {selectedValue
              ? commandFields.find(
                  (field) => String(field.value) === selectedValue
                )?.label ?? "Search columns..."
              : "Search columns..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search columns..."
            onValueChange={(search) => {
              if (!search) return;
              const query = search.toLowerCase();
              commandFields.forEach((field) => {
                const label = field.label.toLowerCase();
                if (label.includes(query)) {
                  setSelectedValue(String(field.value));
                }
              });
            }}
          />
          <CommandList>
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandGroup heading="Columns">
              {commandFields.map((field) => {
                const value = String(field.value);
                return (
                  <CommandItem
                    key={value}
                    value={value}
                    onSelect={(currentValue) => {
                      const newValue = currentValue === selectedValue ? "" : currentValue;
                      setSelectedValue(newValue);
                      setOpen(false);
                      
                      // Find the selected field
                      const selectedField = commandFields.find(f => String(f.value) === newValue);
                      if (selectedField) {
                        // Focus the appropriate filter control based on type
                        const filterControlId = `filter-${selectedField.type}-${String(selectedField.value)}`;
                        setTimeout(() => {
                          const element = document.getElementById(filterControlId);
                          if (element) {
                            element.focus();
                          }
                        }, 100);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {field.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
