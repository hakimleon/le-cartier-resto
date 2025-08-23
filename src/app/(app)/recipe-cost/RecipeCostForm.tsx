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
import { Ingredient, Recipe, RecipeIngredient } from "@/data/definitions"

// We use the actual ingredients data now for a more realistic test case.
// This is passed from the parent page component.
interface RecipeCostFormProps {
  recipe: Recipe | null
  recipes: Recipe[]
  ingredients: Ingredient[]
  recipeIngredients: RecipeIngredient[]
}

export function RecipeCostForm({
  recipe: initialRecipe,
  recipes: allRecipes,
  ingredients: stockIngredients,
  recipeIngredients: allRecipeIngredients,
}: RecipeCostFormProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 1: Validation de la ComboBox</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          Ceci est un exemple de base utilisant les vrais ingrédients pour nous assurer que la sélection fonctionne.
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
                ? stockIngredients.find((ingredient) => ingredient.id.toLowerCase() === value.toLowerCase())?.name
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
                  {stockIngredients.map((ingredient) => (
                    <CommandItem
                      key={ingredient.id}
                      value={ingredient.id}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.toLowerCase() === ingredient.id.toLowerCase() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {ingredient.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value && <p className="mt-4">ID de l'ingrédient sélectionné : <span className="font-bold">{value}</span></p>}
      </CardContent>
    </Card>
  )
}
