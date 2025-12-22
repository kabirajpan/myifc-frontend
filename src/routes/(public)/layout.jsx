import { component$, Slot } from "@builder.io/qwik";
import PublicNavbar from "../../components/layout/public-navbar";
import PublicFooter from "../../components/layout/public-footer";


// Public layout - navbar, sidebar, footer
export default component$(() => {
  return (
    <div class="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <div class="flex flex-1">
        
        <main class="flex-1">
          <Slot />
        </main>
      </div>
      
      <PublicFooter />
    </div>
  );
});
