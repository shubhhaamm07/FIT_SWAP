import { useState } from "react";
import { Text, View } from "react-native";
import { Details } from "../../components/common/ResourcePage";
import SculptureHero from "../../components/common/SculptureHero";
import {
  Badge,
  Button,
  Card,
  Header,
  Page,
  Section,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { dietFields } from "../../constants/diet";
import { useAuth } from "../../contexts/AuthContext";
import { useForm } from "../../contexts/FormContext";
import { useAction } from "../../hooks/useApi";
import { today } from "../wellness/WellnessPage";
export default function DietPlannerPage() {
  const { openForm } = useForm();
  const { call } = useAuth();
  const { busy, run } = useAction();
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [day, setDay] = useState(0);
  function generate() {
    openForm({
      title: "Your nutrition profile",
      description:
        "Personal details are sent only when you ask to generate a plan.",
      fields: dietFields,
      initial: profile,
      submitLabel: "Generate weekly plan",
      onSubmit: async (body) => {
        if (body.healthConcerns.length > 4)
          throw new Error("Choose no more than four health considerations.");
        const input = {
          ...body,
          mealsPerDay: Number(body.mealsPerDay),
          weeklyBudgetInr: body.weeklyBudgetInr || "",
        };
        const result = await call<any>("/diet-planner/generate", {
          method: "POST",
          body: input,
        });
        setProfile(input);
        setPlan(result.data);
        setDay(0);
      },
    });
  }
  const selected = plan?.weeklyPlan?.[day];
  return (
    <Page>
      <Header
        title="Fuel your next chapter."
        subtitle="A practical weekly plan, built around your routine."
        back
      />
      <SculptureHero
        title={"Good food.\nStronger routines."}
        description="Your preferences, budget, and training rhythm belong in the same plan."
        action={plan ? "Update your profile" : "Build my meal plan"}
        onPress={generate}
      />
      {plan && (
        <>
          <Section
            title={
              plan.requiresProfessionalReview
                ? "Professional review recommended"
                : "Your daily targets"
            }
          />
          <Card>
            <Details data={plan.dailyTargets || {}} />
            {plan.reasons?.map((s: string) => (
              <Text key={s} className="mt-3 text-sm leading-6 text-muted">
                {s}
              </Text>
            ))}
          </Card>
          {plan.warnings?.length > 0 && (
            <Card>
              <Text className="font-bold text-amber-400">Before you begin</Text>
              {plan.warnings.map((s: string) => (
                <Text key={s} className="mt-3 text-sm leading-6 text-muted">
                  {s}
                </Text>
              ))}
            </Card>
          )}
          <View className="mb-5 flex-row flex-wrap gap-2">
            {plan.weeklyPlan?.map((d: any, i: number) => (
              <Button
                key={i}
                secondary={i !== day}
                title={d.day}
                onPress={() => setDay(i)}
              />
            ))}
          </View>
          <ResponsiveGrid maxColumns={2}>
            {selected?.meals.map((meal: any, i: number) => (
              <Card key={i}>
                <Badge title={meal.label} />
                <Text className="mt-4 text-xl font-bold text-white">
                  {meal.suggestion}
                </Text>
                <Text className="my-4 text-sm text-muted">
                  {meal.targetCalories} kcal ·{" "}
                  {meal.swapNote || "Suggested meal"}
                </Text>
                <Button
                  secondary
                  title="Find an alternative"
                  busy={busy}
                  onPress={() =>
                    run(async () => {
                      const r = await call<any>("/diet-planner/swap-meal", {
                        method: "POST",
                        body: {
                          profile,
                          day: selected.day,
                          mealLabel: meal.label,
                          targetCalories: meal.targetCalories,
                          currentSuggestion: meal.suggestion,
                        },
                      });
                      setPlan((p: any) => ({
                        ...p,
                        weeklyPlan: p.weeklyPlan.map((d: any, index: number) =>
                          index !== day
                            ? d
                            : {
                                ...d,
                                meals: d.meals.map((m: any, index: number) =>
                                  index !== i
                                    ? m
                                    : {
                                        ...m,
                                        suggestion: r.data.suggestion,
                                        swapNote: r.data.note,
                                      },
                                ),
                              },
                        ),
                      }));
                    })
                  }
                />
                <View className="mt-3">
                  <Button
                    title="Save to meal log"
                    busy={busy}
                    onPress={() =>
                      run(
                        () =>
                          call("/wellness/meals", {
                            method: "POST",
                            body: {
                              mealDate: today(),
                              mealType:
                                ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].find(
                                  (t) => meal.label.toUpperCase().includes(t),
                                ) || "OTHER",
                              label: meal.suggestion,
                              description: `${meal.label} from your FitSwap plan`,
                              estimatedCalories: meal.targetCalories,
                              source: "AI_PLAN",
                            },
                          }),
                        "Meal saved to your log.",
                      )
                    }
                  />
                </View>
              </Card>
            ))}
          </ResponsiveGrid>
          {plan.guidance && (
            <Card>
              <Details data={plan.guidance} />
            </Card>
          )}
          <Section title="Weekly grocery list" />
          {plan.groceryList?.map((group: any) => (
            <Card key={group.category}>
              <Text className="mb-3 text-lg font-bold text-white">
                {group.category}
              </Text>
              {group.items.map((item: any, i: number) => (
                <View key={i} className="flex-row justify-between gap-4 py-2">
                  <Text className="flex-1 text-sm text-white">{item.name}</Text>
                  <Text className="text-sm text-muted">{item.quantity}</Text>
                </View>
              ))}
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
