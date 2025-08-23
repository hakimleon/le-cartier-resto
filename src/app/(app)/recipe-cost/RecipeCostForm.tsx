
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// We use a simple hardcoded list for this first step, just like the shadcn example.
const frameworks = [
  { value: "tomate", label: "Tomate" },
  { value: "mozzarella", label: "Mozzarella" },
  { value: "basilic", label: "Basilic" },
  { value: "filet-de-boeuf", label: "Filet de Boeuf" },
  { value: "parmesan", label: "Parmesan" },
]

export function RecipeCostForm() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 1: Validation de la ComboBox</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          Ceci est un exemple de base pour nous assurer que la sélection dans la liste déroulante fonctionne parfaitement avant de reconstruire le formulaire complet.
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[250px] justify-between"
            >
              {value
                ? frameworks.find((framework) => framework.value === value)?.label
                : "Sélectionner un ingrédient..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandInput placeholder="Rechercher un ingrédient..." />
              <CommandList>
                <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                <CommandGroup>
                  {frameworks.map((framework) => (
                    <CommandItem
                      key={framework.value}
                      value={framework.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === framework.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {framework.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value && <p className="mt-4">Vous avez sélectionné : <span className="font-bold">{value}</span></p>}
      </CardContent>
    </Card>
  )
}
