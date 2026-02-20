import { useState, useEffect, useRef } from "react";
import UserIcon from "../assets/User-Icon.svg";
import OspreyLogo from "../assets/Osprey-Logo.svg";

function NavBar() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const emailRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        fetch("/currentUser")
            .then((res) => res.json())
            .then((data) => setUser(data))
            .catch(() => setUser(null));
    }, []);

    useEffect(() => {
        if (!open) return;
        setTimeout(() => {
            const el = emailRef.current;
            if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
        }, 0);
    }, [user?.email, open]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="w-full shadow-lg h-20 flex items-center justify-between px-4">
            <img src={OspreyLogo} alt="Osprey Logo" />
            <div ref={dropdownRef} className="relative">
                <img src={UserIcon} className={"cursor-pointer"} alt="User Icon" onClick={() => setOpen((prev) => !prev)} title={user?.email ?? ""}/>
                {open && (
                    <div className="absolute right-0 bg-white mt-2"
                         style={{ boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.1), 0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <div className="px-4 py-3">
                            {user?.email && <p className="font-semibold text-sm text-[#1E3869] max-w-50 truncate"
                                               title={isTruncated ? user.email : undefined}>
                                {user.email}
                            </p>}
                        </div>
                        <hr className="border-gray-200" />
                        <div className="py-1">
                            <a href="/logout" className="block px-4 py-2 text-sm text-black hover:bg-gray-200 hover:text-neutral-600">Logout</a>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default NavBar;