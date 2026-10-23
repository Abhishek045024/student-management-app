
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.29.14:3000/students";

// Predefined course list
const COURSES = [
  "Java",
  "Java Full Stack",
  "Python",
  "Python Full Stack",
  "JavaScript",
  "React",
  "React Native",
  "Node.js",
  "MERN Stack",
  "MEAN Stack",
  "Web Development",
  "Mobile App Development",
  "C",
  "C++",
  "C#",
  "B.Tech",
  "MCA",
  "Data Science",
  "Artificial Intelligence",
  "Machine Learning",
  "Cloud Computing",
  "Cyber Security",
  "Database Management",
];

const COLORS = {
  background: "#F6F7FC",
  white: "#FFFFFF",
  text: "#24243A",
  muted: "#85869A",
  primary: "#6554C0",
  purpleLight: "#EEE9FF",
  blue: "#3978E8",
  blueLight: "#E8F0FF",
  green: "#16865B",
  greenLight: "#DFF7EB",
  orange: "#D66B26",
  red: "#D94355",
  border: "#E9E9F2",
};

const avatarColors = [
  { background: "#DFF7EB", foreground: "#16865B" },
  { background: "#FFE8D9", foreground: "#D66B26" },
  { background: "#E0ECFF", foreground: "#3267D5" },
  { background: "#F5E4FF", foreground: "#9747B5" },
];

export default function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [courseDropdownVisible, setCourseDropdownVisible] = useState(false);

  const loadStudents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load students.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response from GET /students.");
      }

      setStudents(
        [...data].sort((a, b) => Number(a.id) - Number(b.id))
      );
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) =>
      [student.id, student.name, student.course].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [students, search]);

  const getNextId = () => {
    const highestId = students.reduce(
      (max, student) => Math.max(max, Number(student.id) || 0),
      0
    );

    return highestId + 1;
  };

  const openAddForm = () => {
    setEditingStudent(null);
    setStudentId(String(getNextId()));
    setName("");
    setCourse("");
    setCourseDropdownVisible(false);
    setFormVisible(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setStudentId(String(student.id));
    setName(student.name || "");
    setCourse(student.course || "");
    setCourseDropdownVisible(false);
    setFormVisible(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormVisible(false);
    setEditingStudent(null);
    setStudentId("");
    setName("");
    setCourse("");
    setCourseDropdownVisible(false);
  };

  const saveStudent = async () => {
    const cleanId = Number(studentId.trim());
    const cleanName = name.trim();
    const cleanCourse = course.trim();

    // Name validation: letters, spaces, dots, apostrophes and hyphens.
    const namePattern = /^[A-Za-z\s.'-]+$/;

    if (!cleanName || !namePattern.test(cleanName)) {
      Alert.alert(
        "Invalid Student Name",
        "Enter a name using English letters. Spaces, full stops (.), apostrophes (') and hyphens (-) are allowed."
      );
      return;
    }

    // Only courses from the predefined list are accepted.
    if (!COURSES.includes(cleanCourse)) {
      Alert.alert(
        "Invalid Course",
        "Please select a course from the available dropdown list."
      );
      return;
    }

    // Student ID must be a positive safe integer.
    if (
      !/^\d+$/.test(studentId.trim()) ||
      !Number.isSafeInteger(cleanId) ||
      cleanId <= 0
    ) {
      Alert.alert(
        "Invalid Student ID",
        "Student ID must be a positive whole number, such as 1 or 25."
      );
      return;
    }

    const duplicateId = students.some(
      (student) =>
        Number(student.id) === cleanId &&
        Number(student.id) !== Number(editingStudent?.id)
    );

    if (duplicateId) {
      Alert.alert(
        "ID already exists",
        `Student ID ${cleanId} is already in use. Please enter a different ID.`
      );
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingStudent);

      const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingStudent.id)}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: cleanId,
          name: cleanName,
          course: cleanCourse,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Unable to ${isEditing ? "update" : "add"} student (${response.status}).`
        );
      }

      setFormVisible(false);
      setEditingStudent(null);
      setStudentId("");
      setName("");
      setCourse("");
      setCourseDropdownVisible(false);

      await loadStudents();

      Alert.alert(
        "Success",
        isEditing
          ? "Student update request completed."
          : "Student added successfully."
      );
    } catch (err) {
      Alert.alert(
        "Unable to save",
        err.message || "Please check the server and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = (student) => {
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/${encodeURIComponent(student.id)}`,
                { method: "DELETE" }
              );

              const result = await response.json().catch(() => ({}));

              if (!response.ok) {
                throw new Error(
                  result.message || `Delete failed (${response.status}).`
                );
              }

              await loadStudents();
              Alert.alert("Success", "Student deleted successfully!");
            } catch (err) {
              Alert.alert(
                "Unable to delete",
                err.message || "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const renderStudent = ({ item, index }) => {
    const avatar = avatarColors[index % avatarColors.length];

    return (
      <View style={styles.studentCard}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatar.background },
          ]}
        >
          <Text style={[styles.avatarText, { color: avatar.foreground }]}>
            {(item.name || "?").trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentCourse}>{item.course}</Text>

          <View style={styles.idBadge}>
            <Text style={styles.idText}>Student ID: {item.id}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Edit ${item.name}`}
            onPress={() => openEditForm(item)}
            style={({ pressed }) => [
              styles.iconButton,
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color={COLORS.blue}
            />
          </Pressable>

          <Pressable
            accessibilityLabel={`Delete ${item.name}`}
            onPress={() => deleteStudent(item)}
            style={({ pressed }) => [
              styles.iconButton,
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color={COLORS.red}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>STUDENT HUB</Text>
          <Text style={styles.greeting}>Hey, welcome! 👋</Text>
          <Text style={styles.subtitle}>
            Manage your students easily
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="school" size={30} color={COLORS.white} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStudents(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.statsCard}>
          <View style={styles.statsText}>
            <Text style={styles.statsLabel}>TOTAL STUDENTS</Text>
            <Text style={styles.statsNumber}>{students.length}</Text>
            <Text style={styles.statsCaption}>
              Registered students
            </Text>
          </View>

          <View style={styles.statsIcon}>
            <Ionicons
              name="people"
              size={32}
              color={COLORS.primary}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Students</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredStudents.length} student(s) found
            </Text>
          </View>

          <Pressable
            onPress={openAddForm}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={21} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color={COLORS.muted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID or course..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.muted}
              />
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
            <Text style={styles.stateText}>Loading students...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color={COLORS.red}
            />

            <Text style={styles.emptyTitle}>
              Could not load students
            </Text>

            <Text style={styles.emptyText}>{error}</Text>

            <Text style={styles.helpText}>
              Check that your backend is running and API_URL uses
              your laptop's current Wi-Fi IPv4 address.
            </Text>

            <Pressable
              onPress={() => loadStudents()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="people-outline"
              size={44}
              color={COLORS.primary}
            />

            <Text style={styles.emptyTitle}>
              {search ? "No matching students" : "No students yet"}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? "Try a different name, ID or course."
                : "Tap Add to register your first student."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderStudent}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        )}

        <Text style={styles.footer}>
          Student Hub • Powered by your API
        </Text>
      </ScrollView>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={styles.backdropTouchable}
            onPress={closeForm}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.formCard}>
              <View style={styles.modalHandle} />

              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>
                    {editingStudent ? "Edit Student" : "Add Student"}
                  </Text>

                  <Text style={styles.formSubtitle}>
                    {editingStudent
                      ? `Update student ID ${editingStudent.id}`
                      : "Enter the student details below"}
                  </Text>
                </View>

                <Pressable
                  onPress={closeForm}
                  disabled={saving}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color={COLORS.text}
                  />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Student ID</Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={COLORS.primary}
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Enter student ID"
                  placeholderTextColor={COLORS.muted}
                  value={studentId}
                  onChangeText={(value) =>
                    setStudentId(value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  editable={!saving}
                />
              </View>

              <Text style={styles.inputLabel}>Student Name</Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Enter student name"
                  placeholderTextColor={COLORS.muted}
                  value={name}
                  onChangeText={(value) =>
                    setName(value.replace(/[^A-Za-z\s.'-]/g, ""))
                  }
                  editable={!saving}
                  maxLength={100}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.inputLabel}>Course</Text>

              <Pressable
                onPress={() => setCourseDropdownVisible((visible) => !visible)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Select student course"
                style={({ pressed }) => [
                  styles.inputBox,
                  styles.courseSelector,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.primary}
                />

                <Text
                  style={[
                    styles.courseSelectedText,
                    !course && styles.coursePlaceholder,
                  ]}
                >
                  {course || "Select a course"}
                </Text>

                <Ionicons
                  name={courseDropdownVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.muted}
                />
              </Pressable>

              {courseDropdownVisible && (
                <View style={styles.courseDropdown}>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    style={styles.courseDropdownScroll}
                  >
                    {COURSES.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setCourse(item);
                          setCourseDropdownVisible(false);
                        }}
                        style={({ pressed }) => [
                          styles.courseOption,
                          course === item && styles.courseOptionSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.courseOptionText,
                            course === item && styles.courseOptionTextSelected,
                          ]}
                        >
                          {item}
                        </Text>

                        {course === item && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={COLORS.primary}
                          />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Pressable
                onPress={saveStudent}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  (pressed || saving) && styles.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name={
                        editingStudent
                          ? "checkmark-circle-outline"
                          : "person-add-outline"
                      }
                      size={20}
                      color={COLORS.white}
                    />

                    <Text style={styles.saveButtonText}>
                      {editingStudent
                        ? "Save Changes"
                        : "Add Student"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 7,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },
  headerIcon: {
    height: 57,
    width: 57,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  statsCard: {
    backgroundColor: COLORS.purpleLight,
    borderRadius: 23,
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 27,
  },
  statsText: {
    gap: 4,
  },
  statsLabel: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  statsNumber: {
    color: COLORS.text,
    fontSize: 35,
    fontWeight: "800",
  },
  statsCaption: {
    color: COLORS.muted,
    fontSize: 12,
  },
  statsIcon: {
    height: 58,
    width: 58,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  list: {
    gap: 13,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  avatar: {
    height: 53,
    width: 53,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 23,
    fontWeight: "800",
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  studentCourse: {
    color: COLORS.muted,
    fontSize: 12,
  },
  idBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F0F8",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  idText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  actions: {
    gap: 8,
  },
  iconButton: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: COLORS.blueLight,
  },
  deleteButton: {
    backgroundColor: "#FFE9EC",
  },
  centerState: {
    paddingVertical: 45,
    alignItems: "center",
    gap: 12,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  helpText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  footer: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 25,
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(24, 23, 45, 0.45)",
  },
  backdropTouchable: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 23,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 35 : 26,
  },
  modalHandle: {
    height: 5,
    width: 43,
    borderRadius: 5,
    backgroundColor: "#DEDEEA",
    alignSelf: "center",
    marginBottom: 21,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
  },
  formSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  closeButton: {
    height: 39,
    width: 39,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },
  inputBox: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 19,
  },
  formInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 12,
  },
  courseSelector: {
    marginBottom: 12,
  },
  courseSelectedText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  coursePlaceholder: {
    color: COLORS.muted,
  },
  courseDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    marginTop: -4,
    marginBottom: 19,
    overflow: "hidden",
  },
  courseDropdownScroll: {
    maxHeight: 220,
  },
  courseOption: {
    minHeight: 47,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F6",
  },
  courseOptionSelected: {
    backgroundColor: COLORS.purpleLight,
  },
  courseOptionText: {
    color: COLORS.text,
    fontSize: 14,
  },
  courseOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
