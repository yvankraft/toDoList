import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useColorScheme } from "nativewind";
import {
  BatteryFullIcon as BatteryFull,
  BatteryLowIcon as BatteryLow,
  BatteryMediumIcon as BatteryMedium,
  BellIcon as Bell,
  CalendarBlankIcon as Calendar,
  CaretDownIcon as CaretDown,
  CheckIcon as Check,
  ClockIcon as Clock,
  ListChecksIcon as ListTodo,
  MinusIcon as Minus,
  PaletteIcon as Palette,
  PlusIcon as Plus,
  RepeatIcon as Repeat,
  NoteIcon as StickyNote,
  XIcon as X,
} from "phosphor-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { GlassCard } from "../components/glass-card";
import {
  ENERGY_LABELS,
  ICON_KEYS,
  RECURRENCE_LABELS,
  TASK_COLORS,
  TASK_ICONS,
  TIME_SLOTS,
} from "../constants/tasks";
import { useTodos } from "../hooks/use-todos";
import {
  addDays,
  DAYS_SHORT,
  formatDayLabel,
  formatDuration,
  fromDateKey,
  minutesToTime,
  timeToMinutes,
  toDateKey,
  todayKey,
} from "../lib/date";
import type {
  EnergyLevel,
  Recurrence,
  SubTask,
  Todo,
  TodoDraft,
} from "../types/todo";

export type TaskDefaults = {
  date?: string | null;
  startTime?: string | null;
};

interface TaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (draft: TodoDraft) => void;
  onDelete?: () => void;
  initialData?: Todo | null;
  defaults?: TaskDefaults;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const supportsNativePicker = Platform.OS === "ios" || Platform.OS === "android";

/** Libellé d'une section du formulaire */
const SectionLabel = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <View className="flex-row items-center gap-2 mb-2 ml-1">
    <Icon size={14} color="#94a3b8" weight="duotone" />
    <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
      {label}
    </Text>
  </View>
);

const Chip = ({
  label,
  selected,
  onPress,
  accent,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className={`px-4 py-2 rounded-full mr-2 mb-2 ${
      selected
        ? ""
        : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
    } ${disabled ? "opacity-40" : "active:opacity-70"}`}
    style={selected ? { backgroundColor: accent } : undefined}
  >
    <Text
      className={`font-semibold text-sm ${
        selected ? "text-white" : "text-gray-700 dark:text-zinc-300"
      }`}
    >
      {label}
    </Text>
  </Pressable>
);

/** Ligne "valeur + chevron" qui déplie un sélecteur natif */
const SelectorRow = ({
  icon: Icon,
  value,
  open,
  onPress,
  accent,
  disabled,
}: {
  icon: any;
  value: string;
  open?: boolean;
  onPress: () => void;
  accent: string;
  disabled?: boolean;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-2 border active:opacity-80 ${
        open
          ? "border-transparent"
          : "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
      } ${disabled ? "opacity-40" : ""}`}
      style={open ? { backgroundColor: accent } : undefined}
    >
      <View className="flex-row items-center gap-2.5">
        <Icon
          size={17}
          color={open ? "#fff" : isDark ? "#a1a1aa" : "#71717a"}
          weight="duotone"
        />
        <Text
          className={`font-bold text-base ${
            open ? "text-white" : "text-gray-800 dark:text-zinc-100"
          }`}
        >
          {value}
        </Text>
      </View>
      <CaretDown
        size={14}
        color={open ? "#fff" : "#94a3b8"}
        weight="bold"
        style={open ? { transform: [{ rotate: "180deg" }] } : undefined}
      />
    </Pressable>
  );
};

/** Sélecteur -/+ à pas libre (durée, rappel…) */
const Stepper = ({
  display,
  onMinus,
  onPlus,
  disabled,
}: {
  display: string;
  onMinus: () => void;
  onPlus: () => void;
  disabled?: boolean;
}) => (
  <View
    className={`flex-row items-center justify-between rounded-2xl px-1.5 py-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${disabled ? "opacity-40" : ""}`}
  >
    <Pressable
      onPress={onMinus}
      disabled={disabled}
      className="w-10 h-10 rounded-xl items-center justify-center bg-white dark:bg-zinc-700 shadow-sm active:scale-90"
    >
      <Minus size={16} color="#71717a" weight="bold" />
    </Pressable>
    <Text className="font-extrabold text-base text-gray-800 dark:text-zinc-100">
      {display}
    </Text>
    <Pressable
      onPress={onPlus}
      disabled={disabled}
      className="w-10 h-10 rounded-xl items-center justify-center bg-white dark:bg-zinc-700 shadow-sm active:scale-90"
    >
      <Plus size={16} color="#71717a" weight="bold" />
    </Pressable>
  </View>
);

export const AddTaskModal = ({
  isVisible,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaults,
}: TaskModalProps) => (
  <Modal
    animationType="fade"
    transparent
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View className="flex-1 justify-end bg-black/60">
      {isVisible && (
        <TaskForm
          initialData={initialData ?? null}
          defaults={defaults}
          onSave={onSave}
          onDelete={onDelete}
          onClose={onClose}
        />
      )}
    </View>
  </Modal>
);

interface TaskFormProps {
  initialData: Todo | null;
  defaults?: TaskDefaults;
  onSave: (draft: TodoDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Le formulaire est remonté à chaque ouverture -> état initialisé depuis les props */
const TaskForm = ({
  initialData,
  defaults,
  onSave,
  onDelete,
  onClose,
}: TaskFormProps) => {
  const { settings } = useTodos();
  const accent = settings.accent;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "check");
  const [color, setColor] = useState(initialData?.color ?? TASK_COLORS[0]);
  const [date, setDate] = useState<string | null>(
    initialData
      ? initialData.date
      : defaults?.date !== undefined
        ? defaults.date
        : todayKey(),
  );
  const [startTime, setStartTime] = useState<string | null>(
    initialData ? initialData.startTime : (defaults?.startTime ?? null),
  );
  const [duration, setDuration] = useState(initialData?.duration ?? 30);
  const [recurrence, setRecurrence] = useState<Recurrence>(
    initialData?.recurrence ?? "none",
  );
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(
    initialData?.reminderMinutes ?? null,
  );
  const [energy, setEnergy] = useState<EnergyLevel | null>(
    initialData?.energy ?? null,
  );
  const [subtasks, setSubtasks] = useState<SubTask[]>(
    initialData?.subtasks ?? [],
  );
  const [subtaskInput, setSubtaskInput] = useState("");
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  const hasSchedule = date !== null;
  const hasTime = hasSchedule && startTime !== null;

  const handleSave = () => {
    if (title.trim().length === 0) return;
    onSave({
      title: title.trim(),
      notes,
      icon,
      color,
      date,
      startTime: hasTime ? startTime : null,
      duration,
      recurrence: hasSchedule ? recurrence : "none",
      reminderMinutes: hasTime ? reminderMinutes : null,
      energy,
      subtasks,
    });
    onClose();
  };

  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (!t) return;
    setSubtasks([...subtasks, { id: uid(), title: t, isCompleted: false }]);
    setSubtaskInput("");
  };

  const dateValue = date ? fromDateKey(date) : new Date();
  const timeValue = (() => {
    const d = date ? fromDateKey(date) : new Date();
    if (startTime) {
      const m = timeToMinutes(startTime);
      d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    }
    return d;
  })();
  const endTime =
    hasTime && startTime ? minutesToTime(timeToMinutes(startTime) + duration) : null;

  const onDateChange = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") setOpenPicker(null);
    if (e.type === "set" && d) setDate(toDateKey(d));
  };
  const onTimeChange = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === "android") setOpenPicker(null);
    if (e.type === "set" && d) {
      setStartTime(minutesToTime(d.getHours() * 60 + d.getMinutes()));
    }
  };

  // Fallback web : bandes de chips (pas de picker natif)
  const nextDays = Array.from({ length: 30 }, (_, i) =>
    addDays(todayKey(), i),
  );

  return (
    <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="bg-white dark:bg-zinc-900 rounded-t-[32px] shadow-2xl"
          style={{ maxHeight: "92%" }}
        >
          <ScrollView
            className="px-6 pt-6"
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-gray-900 dark:text-slate-50">
                {initialData ? "Modifier la tâche" : "Nouvelle tâche"}
              </Text>
              <Pressable
                onPress={onClose}
                className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full active:opacity-70"
              >
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Titre */}
            <TextInput
              placeholder="Que veux-tu faire ?"
              placeholderTextColor="#64748b"
              className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl text-lg dark:text-white border border-gray-100 dark:border-zinc-700 mb-6"
              autoFocus={!initialData}
              value={title}
              onChangeText={setTitle}
              selectionColor={accent}
            />

            {/* Apparence */}
            <SectionLabel icon={Palette} label="Apparence" />
            <GlassCard className="mb-5">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {ICON_KEYS.map((key) => {
                  const Icon = TASK_ICONS[key];
                  const selected = icon === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setIcon(key)}
                      className={`w-11 h-11 rounded-2xl items-center justify-center mr-2 ${
                        selected
                          ? ""
                          : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                      }`}
                      style={
                        selected ? { backgroundColor: color } : undefined
                      }
                    >
                      <Icon
                        size={20}
                        color={selected ? "#fff" : isDark ? "#a1a1aa" : "#71717a"}
                        weight={selected ? "fill" : "duotone"}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View className="flex-row flex-wrap">
                {TASK_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-9 h-9 rounded-full mr-2 mb-1 items-center justify-center active:scale-90"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            {/* Planification */}
            <SectionLabel icon={Calendar} label="Planification" />
            <GlassCard className="mb-5">
              <View className="flex-row flex-wrap">
                <Chip
                  label="Inbox"
                  selected={date === null}
                  onPress={() => {
                    setDate(null);
                    setOpenPicker(null);
                  }}
                  accent={accent}
                />
                <Chip
                  label="Aujourd'hui"
                  selected={date === todayKey()}
                  onPress={() => setDate(todayKey())}
                  accent={accent}
                />
                <Chip
                  label="Demain"
                  selected={date === addDays(todayKey(), 1)}
                  onPress={() => setDate(addDays(todayKey(), 1))}
                  accent={accent}
                />
              </View>

              {hasSchedule &&
                (supportsNativePicker ? (
                  <>
                    <SelectorRow
                      icon={Calendar}
                      value={formatDayLabel(date)}
                      open={openPicker === "date"}
                      onPress={() =>
                        setOpenPicker(openPicker === "date" ? null : "date")
                      }
                      accent={accent}
                    />
                    {openPicker === "date" && (
                      <DateTimePicker
                        value={dateValue}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        minimumDate={new Date()}
                        onChange={onDateChange}
                        accentColor={accent}
                        themeVariant={isDark ? "dark" : "light"}
                      />
                    )}
                  </>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-2"
                  >
                    {nextDays.map((key) => {
                      const d = fromDateKey(key);
                      const selected = date === key;
                      return (
                        <Pressable
                          key={key}
                          onPress={() => setDate(key)}
                          className={`w-14 py-2 rounded-2xl items-center mr-2 ${
                            selected
                              ? ""
                              : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                          }`}
                          style={
                            selected ? { backgroundColor: accent } : undefined
                          }
                        >
                          <Text
                            className={`text-[10px] font-bold uppercase ${
                              selected
                                ? "text-white/80"
                                : "text-gray-400 dark:text-zinc-500"
                            }`}
                          >
                            {DAYS_SHORT[d.getDay()]}
                          </Text>
                          <Text
                            className={`text-lg font-black ${
                              selected
                                ? "text-white"
                                : "text-gray-800 dark:text-zinc-200"
                            }`}
                          >
                            {d.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ))}

              {hasSchedule && <View className="h-3" />}

              {/* Heure de début */}
              {hasSchedule && (
                <>
                  <View className="flex-row flex-wrap">
                    <Chip
                      label="Toute la journée"
                      selected={!hasTime}
                      onPress={() => {
                        setStartTime(null);
                        setOpenPicker(null);
                      }}
                      accent={accent}
                    />
                  </View>
                  {supportsNativePicker ? (
                    <>
                      <SelectorRow
                        icon={Clock}
                        value={hasTime ? startTime! : "Choisir une heure…"}
                        open={openPicker === "time"}
                        onPress={() =>
                          setOpenPicker(openPicker === "time" ? null : "time")
                        }
                        accent={accent}
                      />
                      {openPicker === "time" && (
                        <DateTimePicker
                          value={timeValue}
                          mode="time"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          minuteInterval={5}
                          onChange={onTimeChange}
                          accentColor={accent}
                          themeVariant={isDark ? "dark" : "light"}
                        />
                      )}
                    </>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mb-2"
                    >
                      {TIME_SLOTS.map((t) => {
                        const selected = startTime === t;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => setStartTime(t)}
                            className={`px-3.5 py-2 rounded-xl mr-2 ${
                              selected
                                ? ""
                                : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                            }`}
                            style={
                              selected ? { backgroundColor: accent } : undefined
                            }
                          >
                            <Text
                              className={`font-semibold text-sm ${
                                selected
                                  ? "text-white"
                                  : "text-gray-700 dark:text-zinc-300"
                              }`}
                            >
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Durée */}
                  <View className="mt-1 mb-2">
                    <Text className="text-xs font-semibold text-gray-400 dark:text-zinc-500 mb-2 ml-1">
                      Durée{endTime ? ` · fin à ${endTime}` : ""}
                    </Text>
                    <Stepper
                      display={formatDuration(duration)}
                      onMinus={() => setDuration(Math.max(5, duration - 5))}
                      onPlus={() => setDuration(Math.min(480, duration + 5))}
                    />
                  </View>
                </>
              )}
            </GlassCard>

            {/* Récurrence */}
            <SectionLabel icon={Repeat} label="Répéter" />
            <GlassCard className="mb-5" padding={12}>
              <View className="flex-row flex-wrap">
                {(Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((r) => (
                  <Chip
                    key={r}
                    label={RECURRENCE_LABELS[r]}
                    selected={recurrence === r}
                    onPress={() => setRecurrence(r)}
                    accent={accent}
                    disabled={!hasSchedule}
                  />
                ))}
              </View>
            </GlassCard>

            {/* Rappel */}
            <SectionLabel icon={Bell} label="Rappel" />
            <GlassCard className="mb-5" padding={12}>
              {reminderMinutes === null ? (
                <View className="flex-row flex-wrap">
                  <Chip
                    label="Aucun"
                    selected
                    onPress={() => {}}
                    accent={accent}
                    disabled={!hasTime}
                  />
                  <Chip
                    label="Définir…"
                    selected={false}
                    onPress={() => setReminderMinutes(15)}
                    accent={accent}
                    disabled={!hasTime}
                  />
                </View>
              ) : (
                <Stepper
                  display={`${formatDuration(reminderMinutes)} avant`}
                  onMinus={() =>
                    setReminderMinutes(
                      reminderMinutes <= 5 ? null : reminderMinutes - 5,
                    )
                  }
                  onPlus={() =>
                    setReminderMinutes(Math.min(180, reminderMinutes + 5))
                  }
                  disabled={!hasTime}
                />
              )}
            </GlassCard>

            {/* Énergie */}
            <SectionLabel icon={BatteryMedium} label="Énergie requise" />
            <GlassCard className="mb-5" padding={12}>
              <View className="flex-row flex-wrap">
                {(
                  [
                    { key: "low", Icon: BatteryLow },
                    { key: "medium", Icon: BatteryMedium },
                    { key: "high", Icon: BatteryFull },
                  ] as const
                ).map(({ key, Icon }) => (
                  <View key={key}>
                    <Pressable
                      onPress={() => setEnergy(energy === key ? null : key)}
                      className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full mr-2 mb-2 ${
                        energy === key
                          ? ""
                          : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                      }`}
                      style={
                        energy === key ? { backgroundColor: accent } : undefined
                      }
                    >
                      <Icon
                        size={15}
                        color={energy === key ? "#fff" : "#94a3b8"}
                        weight={energy === key ? "fill" : "duotone"}
                      />
                      <Text
                        className={`font-semibold text-sm ${
                          energy === key
                            ? "text-white"
                            : "text-gray-700 dark:text-zinc-300"
                        }`}
                      >
                        {ENERGY_LABELS[key]}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Sous-tâches */}
            <SectionLabel icon={ListTodo} label="Sous-tâches" />
            <GlassCard className="mb-5">
              {subtasks.map((s) => (
                <View
                  key={s.id}
                  className="flex-row items-center bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 mb-2 border border-gray-100 dark:border-zinc-700"
                >
                  <Pressable
                    onPress={() =>
                      setSubtasks(
                        subtasks.map((x) =>
                          x.id === s.id
                            ? { ...x, isCompleted: !x.isCompleted }
                            : x,
                        ),
                      )
                    }
                    className="w-5 h-5 rounded-full border-2 items-center justify-center mr-3 active:scale-90"
                    style={{
                      borderColor: accent,
                      backgroundColor: s.isCompleted ? accent : "transparent",
                    }}
                  >
                    {s.isCompleted && (
                      <Check size={11} color="#fff" weight="bold" />
                    )}
                  </Pressable>
                  <Text
                    className={`flex-1 font-medium dark:text-white ${
                      s.isCompleted ? "line-through opacity-50" : ""
                    }`}
                  >
                    {s.title}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setSubtasks(subtasks.filter((x) => x.id !== s.id))
                    }
                    className="p-1 active:opacity-60"
                  >
                    <X size={16} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
              <View className="flex-row items-center">
                <TextInput
                  placeholder="Ajouter une sous-tâche..."
                  placeholderTextColor="#64748b"
                  className="flex-1 bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl dark:text-white border border-gray-100 dark:border-zinc-700 mr-2"
                  value={subtaskInput}
                  onChangeText={setSubtaskInput}
                  onSubmitEditing={addSubtask}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={addSubtask}
                  className="p-3 rounded-xl active:opacity-70"
                  style={{ backgroundColor: accent }}
                >
                  <Plus size={18} color="#fff" weight="bold" />
                </Pressable>
              </View>
            </GlassCard>

            {/* Notes */}
            <SectionLabel icon={StickyNote} label="Notes" />
            <GlassCard className="mb-8" padding={8}>
              <TextInput
                placeholder="Détails, liens, idées..."
                placeholderTextColor="#64748b"
                className="p-3 rounded-2xl dark:text-white min-h-[72px]"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </GlassCard>

            {/* Sauvegarder */}
            <Pressable
              onPress={handleSave}
              className="p-4 rounded-2xl items-center active:scale-95 transition-all mb-3"
              style={{
                backgroundColor: accent,
                shadowColor: accent,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              <Text className="text-white font-extrabold text-lg">
                {initialData ? "Enregistrer" : "Créer la tâche"}
              </Text>
            </Pressable>

            {/* Supprimer (édition uniquement) */}
            {initialData && onDelete && (
              <Pressable
                onPress={onDelete}
                className="p-4 rounded-2xl items-center bg-red-500/10 active:opacity-70 mb-4"
              >
                <Text className="text-red-500 font-bold">Supprimer</Text>
              </Pressable>
            )}
          </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddTaskModal;
