import { useState } from "react";
import { useRunValidation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ValidationRequestProcedure } from "@workspace/api-client-react/src/generated/api.schemas";

const formSchema = z.object({
  procedure: z.enum([
    "clarity",
    "understandability",
    "reaction-speed",
    "cognitive-load",
    "user-trust",
    "information-retention",
  ] as const),
});

export default function Validate() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedure: "clarity",
    },
  });

  const { mutate: runValidation, isPending, data: result } = useRunValidation();

  function onSubmit(values: z.infer<typeof formSchema>) {
    runValidation({ data: values });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Human Validation</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Run Validation Procedure</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="procedure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select procedure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ValidationRequestProcedure).map((proc) => (
                            <SelectItem key={proc} value={proc}>
                              {proc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Procedure
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle>Validation Results: {result.procedure}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Checklist</h3>
                <div className="grid gap-4">
                  {result.checklist.map((item) => (
                    <div key={item.id} className="p-4 rounded-md border border-border bg-background">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="font-medium text-white">{item.description}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">Method: {item.method}</p>
                          <p className="text-sm text-muted-foreground">Criteria: {item.acceptanceCriteria}</p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground font-mono">
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Simulation Tools</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {result.simulationTools.map((tool, idx) => (
                      <li key={idx}>{tool}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Replay System</h3>
                  <p className="text-sm text-muted-foreground">{result.replaySystem}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Notes</h3>
                <div className="p-4 rounded-md border border-border bg-background">
                  <p className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">{result.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
