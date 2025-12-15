import { redirect } from "react-router";

export function loader() {
  throw redirect("/admin");
}

export default function Index() {
  return null;
}

