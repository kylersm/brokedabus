import "~/styles/IosevkaBus.css";
import PadPage from "~/components/templates/PadPage";
import { type CSSProperties, type PropsWithChildren, useEffect, useState } from "react";
import { GeistSans } from "geist/font/sans";

const Iosevka: CSSProperties = { fontFamily: "Iosevka Bus Web" };

export default function Headsigns() {
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    const int = setInterval(() => {
      setAnim(anim + 1);
    }, 1000);
    return () => clearInterval(int);
  });

  const randomColor = [COLOR.MAGENTA, COLOR.AQUA, COLOR.YELLOW, COLOR.GREEN, COLOR.RED][Math.floor(5 * Math.random())];

  return (
    <PadPage>
      <i className="">
        A non-exhaustive list of interpretations on various colored headsigns
      </i>

      <div style={Iosevka}>
        <Header>Route 1</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>1</RouteNumber>
            <RouteText fontSize={5} lines={[[COLOR.AQUA, "KAHALA MALL"]]} />
          </Headsign>
          <Headsign>
            <RouteNumber>1</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[[COLOR.AQUA, "KALIHI TRANSIT CENTER"]]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>1</RouteNumber>
            <RouteText fontSize={5} lines={[[COLOR.AQUA, "HAWAII KAI"]]} />
          </Headsign>
        </Griddy>

        <Header>Route 1L</Header>
        <Griddy>
          <Headsign>
            <RouteNumber invert>1L</RouteNumber>
            <RouteText fontSize={5} lines={[[COLOR.AQUA, "HAWAII KAI"]]} />
          </Headsign>
          <Headsign>
            <RouteNumber invert>1L</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[[COLOR.AQUA, "KALIHI TRANSIT CENTER"]]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber invert>1L</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, Math.floor(anim / 3) % 2 === 0 ? "HALAWA" : "ALOHA STADIUM"],
                [COLOR.GREEN, "SKYLINE STATION"]
              ]}
            />
          </Headsign>
        </Griddy>
        
        <Header>Route 2</Header>
        <Griddy>
          <Headsign unsure>
            <RouteNumber>2</RouteNumber>
            <RouteText fontSize={3} lines={[[COLOR.AQUA, "ALAPAI TRANSIT CENTER"]]} />
          </Headsign>
          <Headsign>
            <RouteNumber>2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "SCHOOL STREET-"],
                [COLOR.AQUA, "KALIHI TRANSIT CENTER"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI - KAHALA MALL"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, Math.floor(anim / 3) % 2 == 0 ? "DIAMOND HEAD" : "KAPIOLANI COMMUNITY CO-"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "KAPIOLANI PARK"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "CAMPBELL AVENUE"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 2L</Header>
        <Griddy>
          <Headsign>
            <RouteNumber invert>2L</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI - KAHALA MALL"],
                [COLOR.MAGENTA, "Limited Stops", 2]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber invert>2L</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KALIHI TRANSIT CENTER"],
              ]}
            />
          </Headsign>
        </Griddy>
        
        <Header>Route 3</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>3</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KAPIOLANI"],
                [COLOR.AQUA, "COMMUNITY COLLEGE"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>3</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "SALT LAKE"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>3</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "AALA PARK"]
              ]}
            />
          </Headsign>
        </Griddy>

        <Header>Route 4</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>4</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "McCULLY"],
                [COLOR.GREEN, "Via U.H. MANOA"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>4</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "NUUANU-WYLLIE ST"],
                [COLOR.GREEN, "Via U.H. MANOA"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>4</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "U.H. MANOA"]
              ]}
            />
          </Headsign>
        </Griddy>
        
        <Header>Route 5</Header>
        <Griddy>
          <Headsign unsure>
            <RouteNumber>5</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "ALA MOANA CENTER"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>5</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "MANOA VALLEY"],
              ]}
            />
          </Headsign>
        </Griddy>

        <Header>Route 6</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>6</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "UNIVERSITY"],
                [COLOR.GREEN, "WOODLAWN DRIVE"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>6</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WOODLAWN DRIVE"],
                [COLOR.GREEN, "Via U.H. MANOA"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>6</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "PAUOA VALLEY"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>6</RouteNumber>
            <RouteText
              fontSize={4}
              lines={[
                [COLOR.AQUA, "ALA MOANA CENTER"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>6</RouteNumber>
            <RouteText
              fontSize={4}
              lines={[
                [COLOR.AQUA, "MANOA MARKETPLACE"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 7</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>7</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "KAHALA MALL"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>7</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "KALIHI UKA"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>7</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "KING STREET"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>7</RouteNumber>
            <RouteText
              fontSize={4}
              lines={[
                [COLOR.AQUA, "KALIHI - MOKAUEA"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 8</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>8</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "BEACH & HOTELS"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>8</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "ALA MOANA CENTER-"],
                [COLOR.AQUA, "MAKIKI"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 9</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>9</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KAIMUKI"],
                [COLOR.GREEN, "KAPIOLANI COMM. COLLEGE"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 10</Header>
        <Griddy>
          <Headsign unsure>
            <RouteNumber>10</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "KALIHI KAI"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>10</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "ALEWA HEIGHTS"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>10</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "ALEWA HEIGHTS"],
                [COLOR.GREEN, "Via NUUANU"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>10</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "LILIHA"],
                [COLOR.GREEN, "JUDD STREET"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 13</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>13</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "BEACH & HOTELS"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>13</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "U.H. MANOA"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>13</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[[COLOR.AQUA, "LILIHA"]]}
            />
             <div className={`mr-auto pr-14 my-auto mb-9 w-auto text-3xl`}>
                <p className={`${COLOR.GREEN} -my-[0.5rem]`}>
                  PUUNUI
                </p>
              </div>
          </Headsign>
          <Headsign unsure>
            <RouteNumber>13</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "LILIHA"],
                [COLOR.GREEN, "WYLLIE STREET"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 14</Header>
        <Header>Route 20</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>20</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIKIKI"],
                [COLOR.GREEN, "BEACH & HOTELS"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>20</RouteNumber>
            <RouteText
              fontSize={3}
              lines={Math.floor(anim / 3) % 2 === 0 ? [
                [COLOR.AQUA, "HALAWA"],
                [COLOR.GREEN, "SKYLINE STATION"]
              ] : [
                [COLOR.MAGENTA, "Via AIRPORT-"],
                [COLOR.MAGENTA, "ARIZONA MEMORIAL"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 23</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>23</RouteNumber>
            <RouteText fontSize={5} lines={[[COLOR.AQUA, "KAHALA MALL"]]} />
          </Headsign>
        </Griddy>
        <Header>Route A</Header>
        <Griddy>
          <Headsign unsure>
            <RouteNumber invert>A</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "City Express!"],
                [Math.floor(anim / 3) % 3 == 2 ? COLOR.GREEN : COLOR.AQUA, Math.floor(anim / 3) % 3 === 0 ? "KALAUAO" : Math.floor(anim / 3) % 3 === 1 ? "PEARLRIDGE" : "SKYLINE STATION"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>A</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "City Express!"],
                [COLOR.AQUA, "U.H. MANOA"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 54</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>54</RouteNumber>
            <div
                className={`mx-auto my-auto w-auto text-center text-3xl`}
              >
                <div className='-my-2.5'>
                  <span className={COLOR.GREEN}>LOWER</span> <span className={COLOR.AQUA}>PEARL CITY</span>
                </div>
              </div>
          </Headsign>
          <Headsign unsure>
            <RouteNumber>54</RouteNumber>
            <div
                className={`mx-auto my-auto w-auto text-center text-3xl`}
              >
                <div className='-my-2.5'>
                  <span className={COLOR.GREEN}>UPPER</span> <span className={COLOR.AQUA}>PEARL CITY</span>
                </div>
              </div>
          </Headsign>
        </Griddy>
        <Header>Route 60</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>60</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KANEOHE-HALEIWA"],
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>60</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KANEOHE-WINDWARD MALL"],
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>60</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "HONOLULU"],
                [COLOR.GREEN, "ALA MOANA CENTER"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 61</Header>
        <Griddy>
            <Headsign>
              <RouteNumber>61</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "KANEOHE-AIKAHI"],
                ]}
              />
            </Headsign>
            <Headsign>
              <RouteNumber>61</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "KALIHI TRANSIT CENTER"]
                ]}
              />
            </Headsign>
          </Griddy>
        <Header>Route 65</Header>
          <Griddy>
            <Headsign>
              <RouteNumber>65</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "KAILUA-AHUIMANU"],
                ]}
              />
            </Headsign>
            <Headsign>
              <RouteNumber>65</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "HONOLULU"],
                  [COLOR.GREEN, "ALA MOANA CENTER"]
                ]}
              />
            </Headsign>
          </Griddy>
        <Header>Route 67</Header>
          <Griddy>
            <Headsign>
              <RouteNumber>67</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "KAILUA-WAIMANALO"],
                ]}
              />
            </Headsign>
            <Headsign>
              <RouteNumber>67</RouteNumber>
              <RouteText
                fontSize={3}
                lines={[
                  [COLOR.AQUA, "HONOLULU"],
                  [COLOR.GREEN, "ALA MOANA CENTER"]
                ]}
              />
            </Headsign>
          </Griddy>
        <Header>Route 69</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>69</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "KANEOHE"],
                [COLOR.GREEN, "WINDWARD MALL"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>69</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "OLOMANA"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>69</RouteNumber>
            <RouteText
              fontSize={5}
              lines={[
                [COLOR.AQUA, "WAIMANALO"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber>69</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "WAIMANALO-"],
                [COLOR.GREEN, "SEA LIFE PARK"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Route 102</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>102</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "ALA MOANA CENTER"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>102</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.AQUA, "MAKIKI"],
                [COLOR.GREEN, "Via KEEAUMOKU"]
              ]}
            />
          </Headsign>
        </Griddy>
        <Header>Express!</Header>
        <Griddy>
          <Headsign>
            <RouteNumber>97</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "VILLAGE PARK"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber>98</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, Math.floor(anim / 3) % 2 === 0 ? "MILILANI-" : "WAHIAWA"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH1</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "KAPOLEI-MAKAHA"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH2</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "MILILANI"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH3</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "WAHIAWA HEIGHTS"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH4</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "AHUIMANU EXPRESS"],
                [COLOR.AQUA, "Via KAILUA"]
              ]}
            />
          </Headsign>
          <Headsign>
            <RouteNumber invert>PH6</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "HAWAII KAI"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH7</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, "EWA BEACH"]
              ]}
            />
          </Headsign>
          <Headsign unsure>
            <RouteNumber invert>PH8</RouteNumber>
            <RouteText
              fontSize={3}
              lines={[
                [COLOR.MAGENTA, "Express!"],
                [COLOR.AQUA, Math.floor(anim / 3) % 3 === 0 ? "HALAWA" : Math.floor(anim / 3) % 3 === 1 ? "ALOHA STADIUM" : "SKYLINE STATION"]
              ]}
            />
          </Headsign>
        </Griddy>

        <Header>Misc.</Header>
        <Griddy>
          <Headsign>
            <RouteText fontSize={6} lines={[[COLOR.MAGENTA, "ROAD TEST"]]} />
          </Headsign>
          <Headsign>
            <RouteText fontSize={5} lines={[[COLOR.MAGENTA, "DRIVER TRAINING"]]} />
          </Headsign>
          <Headsign>
            {Math.floor(anim / 3) % 2 === 0 ? <RouteText fontSize={5} lines={[[randomColor!, "NOT IN SERVICE"]]} /> : 
              <div
                className={`mx-auto my-auto w-auto text-center text-3xl`}
              >
                <div className={`${COLOR.AQUA} -my-2.5`}>
                  <span className={COLOR.YELLOW}>The</span>
                  <span className={COLOR.RED}>Bus</span> <span>IS HIRING</span>
                </div>
                <p className={`${COLOR.GREEN} -my-2.5`}>BUS OPERATORS</p>
              </div>}
          </Headsign>
          <Headsign>
            <div
              className={`mx-auto my-auto w-auto text-center text-4xl`}
            >
              <div className={`${COLOR.GREEN} -my-2.5`}>
                <span className={COLOR.AQUA}>100%</span> ELECTRIC BUS
              </div>
            </div>
          </Headsign>
          <div>
            <Headsign>
              <div
                className="bg-white my-auto text-6xl font-bold min-w-[3.75rem] text-center"
              >A</div>
              <div
                className={`mx-auto my-auto w-auto text-center text-5xl`}
              >
                <div className={`text-white -my-2.5`}>
                  KAHALA MALL
                </div>
              </div>
            </Headsign>
          </div>
        </Griddy>
      </div>
    </PadPage>
  );
}

function Header(props: PropsWithChildren) {
  return <div className={`${GeistSans.className} text-5xl text-center font-semibold mb-3 mt-5`}>{props.children}</div>;
}

function Griddy(props: PropsWithChildren) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-4">{props.children}</div>
  );
}

function Headsign(props: PropsWithChildren & { unsure?: boolean; }) {
  return (
    <div className={`flex h-20 w-[24rem] ${props.unsure ? "bg-gray-600" : "bg-black"} px-2`} title={props.unsure ? "My guess (No photo, or could be animated)" : "Verified w/ pic or video"}>{props.children}</div>
  );
}

function RouteNumber(props: { invert?: boolean } & PropsWithChildren) {
  return (
    <div
      className={`${props.invert ? "bg-[#ffff00] min-w-[3.75rem] text-center" : "text-[#ffff00]"} my-auto text-6xl font-bold`}
      style={
        props.invert
          ? {
              WebkitTextStroke: "2px #6df",
            }
          : {}
      }
    >
      {props.children}
    </div>
  );
}

enum COLOR {
  YELLOW = "text-[#ff0]",
  RED = "text-[#f66]",
  MAGENTA = "text-[#d5d]",
  AQUA = "text-[#6df]",
  GREEN = "text-[#3f3]"
}

function RouteText(props: { fontSize: number; lines: ([COLOR, string, number]|[COLOR, string])[] }) {
  return (
    <div
      className={`mx-auto my-auto w-auto text-center text-${props.fontSize}xl`}
    >
      {props.lines.map((l, i) => (
        <p key={`${i}-${l[0]}-${l[1]}`} className={`${l[0]} -my-[0.5rem] ${l[2] ? `text-${l[2]}xl` : ''}`}>
          {l[1]}
        </p>
      ))}
    </div>
  );
}