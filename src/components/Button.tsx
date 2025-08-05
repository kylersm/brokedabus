/**
 * Literally a button.
 * 
 * @param props - Click action if needed, and text to put inside the button. Also allows you to set the color.
 * @returns - A react element.
 */
export default function Button(props: { 
  onClick: () => void;
  color?: Color
} & React.PropsWithChildren) {
  return <div 
    onClick={props.onClick} 
    className={"mx-auto w-fit " + (props.color ?? Color.GRAY) + " cursor-pointer text-white px-3 py-2 rounded-lg my-3 shadow-md shadow-neutral-300 dark:shadow-black active:shadow-inner"}
  >
    {props.children}
  </div>;
}

export enum Color {
  GRAY="bg-gray-500 active:shadow-gray-800",
  GREEN="bg-green-600 active:shadow-gray-500",
  RED="bg-red-600 active:shadow-gray-500"
}