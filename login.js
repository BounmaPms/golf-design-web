async function waitForSupabaseClient() {
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

async function initLoginPage() {
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#adminEmail");
  const passwordInput = document.querySelector("#adminPassword");
  const loginButton = document.querySelector("#loginButton");
  const message = document.querySelector("#loginMessage");
  const togglePassword = document.querySelector("#togglePassword");

  if (
    !form ||
    !emailInput ||
    !passwordInput ||
    !loginButton ||
    !message
  ) {
    return;
  }

  try {
    const supabase = await waitForSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      window.location.replace("admin-gallery.html");
      return;
    }

    togglePassword?.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "🙈" : "👁";
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        message.textContent = "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ";
        return;
      }

      loginButton.disabled = true;
      loginButton.textContent = "ກຳລັງເຂົ້າລະບົບ...";
      message.textContent = "";
      message.classList.remove("success");

      try {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error("ไม่พบ Session หลังเข้าสู่ระบบ");
        }

        message.textContent = "ເຂົ້າສູ່ລະບົບສຳເລັດ";
        message.classList.add("success");

        const params = new URLSearchParams(window.location.search);

        const nextPage =
          params.get("next") || "admin-gallery.html";

        window.location.replace(nextPage);
      } catch (error) {
        console.error("Login error:", error);

        message.textContent =
          error.message === "Invalid login credentials"
            ? "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ"
            : error.message || "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ";
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = "ເຂົ້າສູ່ລະບົບ";
      }
    });
  } catch (error) {
    console.error(error);
    message.textContent = error.message;
  }
}

document.addEventListener("DOMContentLoaded", initLoginPage);