import json
import logging

from core.database import db_manager
from models.program_days import ProgramDays
from sqlalchemy import delete, func, select

logger = logging.getLogger(__name__)

PROGRAM_NAME = "Be skausmo-10"

BE_SKAUSMO_10_DAYS = [
    # day, order, name, sets, reps_or_time, [steps...], video
    (1, 1, "Klubo lenkiamųjų tempimas", "2", "30 s / kiekviena pusė", ["Vieną kelį padėk ant žemės.", "Kitą koją pastatyk priekyje.", "Stumk klubus lengvai į priekį.", "Laikyk nugarą tiesią ir jausk tempimą kirkšnyje."], "https://youtu.be/pX4IJXjK7N0"),
    (1, 2, "Atversta knyga", "1", "8 kartai / kiekviena pusė", ["Atsigulk ant šono, kojos sulenktos.", "Abi rankas ištiesk prieš save.", "Viršutinę ranką suk atgal atverdamas krūtinę.", "Lėtai grįžk į pradinę padėtį."], "https://youtu.be/cmSa-iSgoEA"),
    (1, 3, "Knyga atsigulus", "2", "12 / kiekviena pusė", ["Atsigulk ant šono, keliai sulenkti.", "Pėdas laikyk kartu.", "Kelk viršutinį kelį į viršų.", "Lėtai nuleisk žemyn."], "https://youtu.be/TAgK18sd0YM"),
    (1, 4, "Kojos tiesimas atgal keturių taškų padėtyje", "2", "8 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk vieną koją atgal.", "Laikyk dubenį stabilų.", "Grįžk ir keisk pusę."], "https://youtu.be/pnb6rNdAdhs"),
    (1, 5, "Tiltelis", "2", "10", ["Atsigulk ant nugaros, keliai sulenkti.", "Pėdas padėk ant žemės.", "Pakelk dubenį aukštyn įtempdamas sėdmenis.", "Lėtai nuleisk žemyn."], "https://youtu.be/sUSfRs2nOkY"),
    (1, 6, "Vaiko poza", "1", "1 min", ["Atsisėsk ant kulnų.", "Rankas ištiesk į priekį.", "Nuleisk krūtinę žemyn.", "Ramiai pabūk tempime."], "https://youtu.be/_IDUZZ6uFdU"),
    (2, 1, "Keturių taškų siūbavimas", "2", "10", ["Atsistok ant keturių.", "Laikyk nugarą neutralią.", "Lėtai sėsk klubais atgal link kulnų.", "Grįžk į pradinę padėtį."], "https://youtu.be/PN6fR5y5sYE"),
    (2, 2, "Klubo lenkiamųjų tempimas", "2", "30 s / kiekviena pusė", ["Vieną kelį padėk ant žemės.", "Kitą koją pastatyk priekyje.", "Stumk klubus lengvai į priekį.", "Laikyk nugarą tiesią."], "https://youtu.be/pX4IJXjK7N0"),
    (2, 3, "Hip hinge prie sienos", "2", "10", ["Atsistok nugara į sieną.", "Stumk klubus atgal link sienos.", "Nugarą laikyk tiesią.", "Grįžk atsistodamas."], "https://youtu.be/YLLlzyJcSvA"),
    (2, 4, "Žingsniavimas gulint", "2", "10 / kiekviena pusė", ["Atsigulk ant nugaros, keliai sulenkti.", "Pakelk vieną pėdą nuo žemės.", "Nuleisk ją atgal.", "Kartok pakaitomis abiem kojomis."], "https://youtu.be/BSGmyJStYUQ"),
    (2, 5, "Šoninis kojos kėlimas gulint", "2", "10 / kiekviena pusė", ["Atsigulk ant šono.", "Apatinę koją šiek tiek sulenk.", "Viršutinę koją kelk aukštyn.", "Lėtai nuleisk."], "https://youtu.be/O9MJW1kt0d0"),
    (2, 6, "Krūtinės pakėlimas gulint ant pilvo", "2", "10", ["Atsigulk ant pilvo.", "Rankas laikyk prie šonų arba prie galvos.", "Lengvai pakelk krūtinę nuo žemės.", "Lėtai nuleisk."], "https://youtu.be/_qDGzBPB3hA"),
    (3, 1, "Atversta knyga", "1", "8 / kiekviena pusė", ["Atsigulk ant šono, kojos sulenktos.", "Rankas laikyk prieš save.", "Viršutinę ranką suk atgal.", "Lėtai grįžk."], "https://youtu.be/cmSa-iSgoEA"),
    (3, 2, "Wall slides", "2", "10", ["Atsistok nugara prie sienos.", "Rankas priglausk prie sienos.", "Kelk rankas aukštyn.", "Lėtai nuleisk."], "https://youtube.com/shorts/sHO9iD0jEFc"),
    (3, 3, "Kojos tiesimas atgal keturių taškų padėtyje", "2", "10 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk vieną koją atgal.", "Laikyk dubenį stabilų.", "Grįžk ir keisk pusę."], "https://youtu.be/pnb6rNdAdhs"),
    (3, 4, "Tiltelis", "2", "12", ["Atsigulk ant nugaros, keliai sulenkti.", "Pėdos ant žemės.", "Pakelk dubenį aukštyn.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (3, 5, "Kojos tiesimas atgal stovint", "2", "10 / kiekviena pusė", ["Atsistok tiesiai.", "Vieną koją tiesk atgal.", "Nesilenk per juosmenį.", "Grįžk ir keisk pusę."], "https://youtu.be/pVrCtK_K-Xw"),
    (3, 6, "Vaiko poza", "1", "1 min", ["Atsisėsk ant kulnų.", "Rankas tiesk į priekį.", "Nuleisk krūtinę žemyn.", "Ramiai pabūk."], "https://youtu.be/_IDUZZ6uFdU"),
    (4, 1, "Klubo lenkiamųjų tempimas", "2", "30 s / kiekviena pusė", ["Vieną kelį padėk ant žemės.", "Kitą koją pastatyk priekyje.", "Stumk klubus į priekį.", "Laikyk nugarą tiesią."], "https://youtu.be/pX4IJXjK7N0"),
    (4, 2, "Hip hinge prie sienos", "2", "12", ["Atsistok nugara į sieną.", "Stumk klubus atgal.", "Laikyk nugarą neutralią.", "Grįžk atsistodamas."], "https://youtu.be/YLLlzyJcSvA"),
    (4, 3, "Knyga atsigulus", "2", "12 / kiekviena pusė", ["Atsigulk ant šono.", "Pėdas laikyk kartu.", "Kelk viršutinį kelį.", "Lėtai nuleisk."], "https://youtu.be/TAgK18sd0YM"),
    (4, 4, "Bird dog", "2", "8 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk priešingą ranką ir koją.", "Laikyk kūną stabilų.", "Grįžk ir keisk pusę."], "https://youtu.be/bitPXu7LqHY"),
    (4, 5, "Tiltelis", "2", "12", ["Atsigulk ant nugaros, keliai sulenkti.", "Įremk pėdas į žemę.", "Pakelk dubenį aukštyn.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (4, 6, "4 figūros tempimas", "1", "45 s / kiekviena pusė", ["Atsigulk ant nugaros.", "Vieną čiurną užkelk ant kitos kojos kelio.", "Trauk koją link savęs.", "Laikyk tempimą."], "https://youtu.be/c6Ff_y5Npmc"),
    (5, 1, "Atversta knyga", "1", "8 / kiekviena pusė", ["Atsigulk ant šono.", "Rankas laikyk prieš save.", "Viršutinę ranką suk atgal.", "Grįžk lėtai."], "https://youtu.be/cmSa-iSgoEA"),
    (5, 2, "Wall slides", "2", "10", ["Nugara prie sienos.", "Rankos remiasi į sieną.", "Kelk rankas aukštyn.", "Lėtai nuleisk."], "https://youtube.com/shorts/sHO9iD0jEFc"),
    (5, 3, "Tiltelis", "3", "10", ["Atsigulk ant nugaros.", "Keliai sulenkti.", "Pakelk dubenį aukštyn.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (5, 4, "Šoninė lenta nuo kelių", "2", "20 s / kiekviena pusė", ["Atsiremk į dilbį.", "Kelius palik ant žemės.", "Pakelk klubus.", "Laikyk kūną tiesų."], "https://youtu.be/qT66F5Ps2dk"),
    (5, 5, "Šoninis kojos kėlimas gulint", "2", "12 / kiekviena pusė", ["Atsigulk ant šono.", "Viršutinę koją kelk aukštyn.", "Laikyk liemenį stabilų.", "Lėtai nuleisk."], "https://youtu.be/O9MJW1kt0d0"),
    (5, 6, "Krūtinės pakėlimas gulint ant pilvo", "2", "10", ["Atsigulk ant pilvo.", "Lengvai pakelk krūtinę.", "Neužriesk kaklo.", "Lėtai nuleisk."], "https://youtu.be/_qDGzBPB3hA"),
    (6, 1, "Keturių taškų siūbavimas", "2", "10", ["Atsistok ant keturių.", "Stumk klubus atgal.", "Išlaikyk neutralią nugarą.", "Grįžk į pradžią."], "https://youtu.be/PN6fR5y5sYE"),
    (6, 2, "Hip hinge prie sienos", "2", "12", ["Atsistok nugara į sieną.", "Klubus stumk atgal.", "Neapvalink nugaros.", "Grįžk į viršų."], "https://youtu.be/YLLlzyJcSvA"),
    (6, 3, "Kojos tiesimas atgal keturių taškų padėtyje", "2", "10 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk vieną koją atgal.", "Stabilizuok dubenį.", "Grįžk ir keisk pusę."], "https://youtu.be/pnb6rNdAdhs"),
    (6, 4, "Tiltelis", "2", "12", ["Atsigulk ant nugaros.", "Pėdos ant žemės.", "Pakelk dubenį aukštyn.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (6, 5, "Pritūpimai iki kėdės", "2", "10", ["Atsistok prieš kėdę.", "Leiskis žemyn iki prisilietimo.", "Stumkis aukštyn per kulnus.", "Laikyk nugarą neutralią."], ""),
    (6, 6, "Klubo lenkiamųjų tempimas", "1", "30 s / kiekviena pusė", ["Vieną kelį padėk ant žemės.", "Kitą koją laikyk priekyje.", "Lengvai stumk klubus į priekį.", "Laikyk tempimą."], "https://youtu.be/pX4IJXjK7N0"),
    (7, 1, "Atversta knyga", "1", "8 / kiekviena pusė", ["Atsigulk ant šono.", "Rankos prieš save.", "Viršutinę ranką suk atgal.", "Grįžk lėtai."], "https://youtu.be/cmSa-iSgoEA"),
    (7, 2, "Wall slides", "2", "10", ["Nugara prie sienos.", "Rankas laikyk prie sienos.", "Kelk aukštyn.", "Lėtai nuleisk."], "https://youtube.com/shorts/sHO9iD0jEFc"),
    (7, 3, "Tiltelis", "3", "12", ["Atsigulk ant nugaros.", "Keliai sulenkti.", "Pakelk dubenį.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (7, 4, "Bird dog", "2", "8 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk priešingą ranką ir koją.", "Išlaikyk stabilumą.", "Grįžk ir keisk pusę."], "https://youtu.be/bitPXu7LqHY"),
    (7, 5, "Šoninė lenta nuo kelių", "2", "25 s / kiekviena pusė", ["Atsiremk į dilbį.", "Kelius laikyk ant žemės.", "Pakelk klubus.", "Laikyk kūną tiesų."], "https://youtu.be/qT66F5Ps2dk"),
    (7, 6, "4 figūros tempimas", "1", "45 s / kiekviena pusė", ["Atsigulk ant nugaros.", "Uždėk vieną čiurną ant kitos kojos.", "Trauk koją link savęs.", "Laikyk tempimą."], "https://youtu.be/c6Ff_y5Npmc"),
    (8, 1, "Hip hinge prie sienos", "2", "12", ["Atsistok nugara į sieną.", "Stumk klubus atgal.", "Nugarą laikyk tiesią.", "Grįžk atsistodamas."], "https://youtu.be/YLLlzyJcSvA"),
    (8, 2, "Pritūpimai iki kėdės", "2", "12", ["Atsistok prieš kėdę.", "Leiskis žemyn.", "Lengvai paliesk kėdę.", "Grįžk aukštyn."], ""),
    (8, 3, "Tiltelis", "3", "12", ["Atsigulk ant nugaros.", "Pėdos ant žemės.", "Pakelk dubenį.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (8, 4, "Šoninė lenta nuo kelių", "2", "25–30 s / kiekviena pusė", ["Atsiremk į dilbį.", "Kelius laikyk ant žemės.", "Pakelk klubus.", "Laikyk."], "https://youtu.be/qT66F5Ps2dk"),
    (8, 5, "Lipimas ant laiptelio", "2", "10 / kiekviena pusė", ["Užlipk ant laiptelio viena koja.", "Pilnai išsitiesk.", "Lėtai nulipk.", "Keisk pusę."], ""),
    (8, 6, "Vaiko poza", "1", "1 min", ["Atsisėsk ant kulnų.", "Rankas tiesk į priekį.", "Nuleisk krūtinę.", "Atsipalaiduok."], "https://youtu.be/_IDUZZ6uFdU"),
    (9, 1, "Atversta knyga", "1", "8 / kiekviena pusė", ["Atsigulk ant šono.", "Rankos prieš save.", "Viršutinę ranką suk atgal.", "Grįžk."], "https://youtu.be/cmSa-iSgoEA"),
    (9, 2, "Wall slides", "2", "10", ["Atsistok prie sienos.", "Rankas priglausk prie sienos.", "Kelk į viršų.", "Lėtai nuleisk."], "https://youtube.com/shorts/sHO9iD0jEFc"),
    (9, 3, "Bird dog", "2", "10 / kiekviena pusė", ["Atsistok ant keturių.", "Ištiesk priešingą ranką ir koją.", "Išlaikyk dubenį stabilų.", "Grįžk ir keisk."], "https://youtu.be/bitPXu7LqHY"),
    (9, 4, "Stovimas kojos kėlimas į šoną", "2", "12 / kiekviena pusė", ["Atsistok tiesiai.", "Kelk vieną koją į šoną.", "Nesikreipk liemeniu.", "Lėtai nuleisk."], ""),
    (9, 5, "Kojos tiesimas atgal stovint", "2", "12 / kiekviena pusė", ["Atsistok tiesiai.", "Tiesk vieną koją atgal.", "Nesilenk per juosmenį.", "Grįžk ir keisk."], "https://youtu.be/pVrCtK_K-Xw"),
    (9, 6, "Krūtinės pakėlimas gulint ant pilvo", "2", "12", ["Atsigulk ant pilvo.", "Lengvai pakelk krūtinę.", "Laikyk kaklą neutralų.", "Lėtai nuleisk."], "https://youtu.be/_qDGzBPB3hA"),
    (10, 1, "Klubo lenkiamųjų tempimas", "1", "30 s / kiekviena pusė", ["Vieną kelį padėk ant žemės.", "Kitą koją pastatyk priekyje.", "Stumk klubus į priekį.", "Laikyk nugarą tiesią."], "https://youtu.be/pX4IJXjK7N0"),
    (10, 2, "Hip hinge prie sienos", "2", "12", ["Atsistok nugara į sieną.", "Klubus stumk atgal.", "Nugarą laikyk neutralią.", "Grįžk."], "https://youtu.be/YLLlzyJcSvA"),
    (10, 3, "Pritūpimai iki kėdės", "2", "12", ["Atsistok prieš kėdę.", "Leiskis žemyn.", "Lengvai paliesk kėdę.", "Grįžk aukštyn."], ""),
    (10, 4, "Tiltelis", "2", "15", ["Atsigulk ant nugaros.", "Pėdos ant žemės.", "Pakelk dubenį.", "Lėtai nuleisk."], "https://youtu.be/sUSfRs2nOkY"),
    (10, 5, "Šoninė lenta nuo kelių", "2", "30 s / kiekviena pusė", ["Atsiremk į dilbį.", "Kelius laikyk ant žemės.", "Pakelk klubus.", "Laikyk tiesų kūną."], "https://youtu.be/qT66F5Ps2dk"),
    (10, 6, "Lipimas ant laiptelio", "2", "10 / kiekviena pusė", ["Užlipk ant laiptelio.", "Išsitiesk pilnai.", "Lėtai nulipk.", "Keisk koją."], ""),
]


async def initialize_be_skausmo_10_data() -> None:
    """Seed Be skausmo-10 10-day structure when missing."""
    if not db_manager.async_session_maker:
        logger.warning("DB session maker unavailable; skipping Be skausmo-10 seed")
        return

    async with db_manager.async_session_maker() as session:
        async with session.begin():
            count_q = select(func.count()).select_from(ProgramDays).where(ProgramDays.program_name == PROGRAM_NAME)
            existing_count = (await session.execute(count_q)).scalar() or 0
            if existing_count == len(BE_SKAUSMO_10_DAYS):
                logger.info("Be skausmo-10 seed already present (%s rows)", existing_count)
                return

            await session.execute(delete(ProgramDays).where(ProgramDays.program_name == PROGRAM_NAME))
            for day, order, name, sets, reps, steps, video in BE_SKAUSMO_10_DAYS:
                session.add(
                    ProgramDays(
                        program_name=PROGRAM_NAME,
                        day_number=day,
                        order_index=order,
                        exercise_name=name,
                        sets=sets,
                        reps_or_time=reps,
                        instructions=json.dumps(steps, ensure_ascii=False),
                        video_link=video or "",
                    )
                )
        logger.info("Seeded Be skausmo-10 program days (%s rows)", len(BE_SKAUSMO_10_DAYS))
