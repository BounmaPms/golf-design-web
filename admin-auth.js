async function waitForAdminSupabase() {
  let attempts = 0;

  while (!window.supabaseClient && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.supabaseClient) {
    throw new Error("Supabase เชื่อมต่อไม่สำเร็จ");
  }

  return window.supabaseClient;
}

async function protectAdminPage() {
  try {
    document.documentElement.classList.add("auth-checking");

    const supabase = await waitForAdminSupabase();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session) {
      const currentPage =
        window.location.pathname.split("/").pop() +
        window.location.search;

      window.location.replace(
        `login.html?next=${encodeURIComponent(currentPage)}`,
      );

      return false;
    }

    document.documentElement.classList.remove("auth-checking");
    document.documentElement.classList.add("auth-ready");

    const adminEmail = document.querySelector("#adminEmailDisplay");

    if (adminEmail) {
      adminEmail.textContent = session.user.email || "Admin";
    }

    return true;
  } catch (error) {
    console.error("ตรวจสอบ Admin ไม่สำเร็จ:", error);

    window.location.replace("login.html");

    return false;
  }
}

async function logoutAdmin() {
  try {
    const supabase = await waitForAdminSupabase();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      throw error;
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    alert(error.message || "ออกจากระบบไม่สำเร็จ");
  }
}

async function logoutAdmin() {
    if (!confirm("ออกจากระบบ ?")) return;

    const supabase = await waitForAdminSupabase();

    const { error } = await supabase.auth.signOut({
        scope: "local"
    });

    if (error) {
        alert(error.message);
        return;
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutAdmin");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutAdmin);
    }

});

window.protectAdminPage = protectAdminPage;
window.logoutAdmin = logoutAdmin;