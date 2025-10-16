import type {Route} from "./+types/home";
import NavMenu from "../components/NavMenu";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Nexus"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export default function Home() {
    return (
        <main>
            <header className="flex justify-between p-4 bg-indigo-800 w-full items-center">
                <div className="flex flex-row items-center gap-4">
                    <img src="images/logo.png" alt="Logo" className="h-12 rounded-full"/>
                    <h1 className="text-2xl">Nexus</h1>
                </div>
                <NavMenu/>
            </header>
        </main>
    )
}
