import Image from "next/image";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";

/**
 * The 'Not Found' page. Can also be used for client HTTP/S errors
 * 
 * @param props - Error message (shown in bold) as well as additional text to show the user.
 * @returns - A react element.
 */
export default function NotFound(props: {
  errorMessage: string;
} & PropsWithChildren) {
  const router = useRouter();

  return <div className='w-full h-full flex'>
    <div className='m-auto text-center'>
      <Image className="mx-auto" width={200} height={200} src={"/brokedabus/bus404.png"} alt="A cartoonish bus drawn with a confused expression on it's face with its front wheels holding a paper"/>
      <p className='text-4xl font-bold m-2'>{props.errorMessage}</p>
      {props.children}<br/>
      <p onClick={() => router.back()} className='mt-4 mx-auto w-fit cursor-pointer text-blue-500 underline'>{"<< Go Back"}</p>
    </div>
  </div>;
}