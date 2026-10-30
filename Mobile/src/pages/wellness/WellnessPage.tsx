import { useState } from "react";
import { Text, View } from "react-native";
import BarChart from "../../components/charts/BarChart";
import { Details } from "../../components/common/ResourcePage";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
  Section,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import {
  numberField,
  selectField,
  textField,
  useForm,
  type FormField,
} from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const workoutFields: FormField[] = [
  textField("title", "Workout title"),
  textField("focus", "Training focus", false),
  {
    key: "weekday",
    label: "Day of week",
    type: "select",
    options: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].map((label, i) => ({ value: String(i + 1), label })),
    initial: "1",
    required: true,
  },
  numberField("durationMinutes", "Duration in minutes", 45),
  { key: "notes", label: "Notes", type: "multiline" },
];
const mealFields: FormField[] = [
  textField("label", "Meal name"),
  selectField("mealType", "Meal", [
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "SNACK",
    "OTHER",
  ]),
  {
    key: "mealDate",
    label: "Date (YYYY-MM-DD)",
    initial: today(),
    required: true,
  },
  { key: "description", label: "Description", type: "multiline" },
  {
    ...numberField("estimatedCalories", "Estimated calories"),
    required: false,
  },
];
export default function WellnessPage() {
  const [tab, setTab] = useState("workouts");
  const { call } = useAuth();
  const { openForm } = useForm();
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const state = useResource<any>(
    `/wellness/${tab === "insights" ? "insights" : tab}`,
  );
  const data = state.data?.data;
  const items = tab === "workouts" ? data?.schedules || [] : data?.meals || [];
  const edit = (item?: any) =>
    openForm({
      title: `${item ? "Edit" : "Add"} ${tab === "workouts" ? "workout" : "meal"}`,
      fields: tab === "workouts" ? workoutFields : mealFields,
      initial: item,
      onSubmit: async (v) => {
        const body =
          tab === "workouts"
            ? { ...v, weekday: Number(v.weekday) }
            : { ...v, source: item?.source || "MANUAL" };
        await call(`/wellness/${tab}${item ? `/${item.id}` : ""}`, {
          method: item ? "PATCH" : "POST",
          body,
        });
        state.reload();
      },
    });
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Build your rhythm."
        subtitle="Train with a plan. Eat with intent."
        back
      />
      <View className="mb-6 flex-row flex-wrap gap-2">
        {["workouts", "meals", "insights"].map((t) => (
          <Button
            key={t}
            title={t[0].toUpperCase() + t.slice(1)}
            secondary={tab !== t}
            onPress={() => setTab(t)}
          />
        ))}
      </View>
      {tab !== "insights" && (
        <Button
          title={tab === "workouts" ? "Add workout" : "Log a meal"}
          onPress={() => edit()}
        />
      )}
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {data?.summary && (
        <Card>
          <Details data={data.summary} />
        </Card>
      )}
      {tab === "insights" ? (
        data && (
          <Card>
            <Text className="mb-4 text-lg font-bold text-white">
              Your private wellness insights
            </Text>
            <Details data={data.summary || data} />
            {!!data.days?.length && (
              <>
                <Section title="30-day workout activity" />
                <BarChart
                  data={data.days}
                  labelKey="date"
                  valueKey="workoutsCompleted"
                />
                <Section title="Meal adherence" />
                <BarChart
                  data={data.days}
                  labelKey="date"
                  valueKey="mealsFollowed"
                />
              </>
            )}
            {data.recommendations?.map((t: any, i: number) => (
              <Text key={i} className="mt-3 text-sm leading-6 text-muted">
                {typeof t === "string" ? t : t.message || t.description}
              </Text>
            ))}
          </Card>
        )
      ) : (
        <>
          <Section
            title={tab === "workouts" ? "Weekly schedule" : "Meal log"}
          />
          <ResponsiveGrid maxColumns={2}>
            {items.map((item: any) => {
              const done =
                tab === "workouts"
                  ? item.completions?.some(
                      (c: any) =>
                        String(c.completedOn).slice(0, 10) === today(),
                    )
                  : item.isFollowed;
              return (
                <Card key={item.id}>
                  <Badge
                    title={
                      tab === "workouts"
                        ? [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ][item.weekday - 1]
                        : item.mealType
                    }
                  />
                  <Text className="mt-4 text-xl font-bold text-white">
                    {item.title || item.label}
                  </Text>
                  <Text className="my-3 text-sm leading-6 text-muted">
                    {item.focus || item.description || item.notes}
                  </Text>
                  <Text className="mb-4 text-xs text-muted">
                    {tab === "workouts"
                      ? `${item.durationMinutes || "—"} minutes`
                      : `${item.estimatedCalories || "—"} kcal · ${String(item.mealDate).slice(0, 10)}`}
                  </Text>
                  <Button
                    secondary
                    title={
                      done
                        ? "Mark incomplete"
                        : tab === "workouts"
                          ? "Complete today’s workout"
                          : "Mark as followed"
                    }
                    busy={busy}
                    onPress={() =>
                      run(async () => {
                        await call(
                          `/wellness/${tab}/${item.id}${tab === "workouts" ? "/completion" : ""}`,
                          {
                            method: "PATCH",
                            body:
                              tab === "workouts"
                                ? { completedOn: today(), completed: !done }
                                : { isFollowed: !done },
                          },
                        );
                        state.reload();
                      })
                    }
                  />
                  <View className="mt-3 flex-row gap-3">
                    <Button secondary title="Edit" onPress={() => edit(item)} />
                    <Button
                      secondary
                      title="Remove"
                      busy={busy}
                      onPress={() =>
                        run(async () => {
                          if (
                            !(await confirm(
                              "Remove this entry?",
                              "This entry will be removed from your wellness log.",
                              "Remove",
                            ))
                          )
                            return;
                          await call(`/wellness/${tab}/${item.id}`, {
                            method: "DELETE",
                          });
                          state.reload();
                        })
                      }
                    />
                  </View>
                </Card>
              );
            })}
          </ResponsiveGrid>
          {!state.loading && !state.error && !items.length && (
            <Empty
              title="Make room for a new routine"
              body="Add your first entry above."
            />
          )}
        </>
      )}
    </Page>
  );
}
