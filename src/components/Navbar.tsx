import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * The navbar shown at the top of the screen.
 * 
 * HEA bus and shringo dev text is shown if screen is big enough
 * All 4 buttons and back arrow will be usable no matter what size.
 * 
 * @returns - A react element.
 */
export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-screen bg-slate-500 text-white py-3 px-5 flex shadow-nav z-50">
      <div onClick={() => router.back()} 
        className='cursor-pointer flex'
        title="Click to navigate to the previous page."
        style={{
          textShadow: "2px 2px 2px rgba(0, 0, 0, 0.25)"
        }}
      >
        <svg className="my-auto" height={20} width={20} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <line strokeLinecap="round" x1={30} y1={55} x2={5} y2={30} strokeWidth={5} stroke="#fff"/>
          <line strokeLinecap="round" x1={30} y1={5} x2={5} y2={30} strokeWidth={5} stroke="#fff"/>
        </svg>
      </div>
      <div className="ml-5 mr-auto md:block hidden" title="WHERE is the bus?">{"‘"}HEA da bus?</div>
      {/* <div className="mr-auto absolute md:hidden">&larr;</div> */}
      <div className="mx-auto flex gap-10">
          <Link href={"/vehicles"}>
            <span className="sm:block hidden">Show all vehicles</span>
            <span className="sm:hidden block">Vehicles</span>
          </Link>
          <Link href={"/search"}>Search</Link>
          <Link href={"/favorites"}>Favorites</Link>
          <Link href={"/"}>Home</Link>
      </div>
      <div className="ml-auto md:block hidden">
        <Link href={"https://github.com/shringo"}>© shringo {new Date().getFullYear()}</Link>
      </div>
    </nav>
  )
}